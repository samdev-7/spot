<script lang="ts">
  import { onMount } from 'svelte'
  import { BasicAction, Icons, Result, SearchResult, URLAction } from './searchTypes'
  import Icon from './Icon.svelte'
  import ResultRow from './ResultRow.svelte'

  export let newTab = false

  let input: HTMLInputElement
  let query = ''
  let queryIcon: Icons = 'search'
  let results: Result[] = []
  let resultSelection = 0
  let lockResults = false
  let isMac = false

  let googleSuggestionTimeout: NodeJS.Timeout | null = null
  let googleSuggestionAbortController = new AbortController()

  onMount(() => {
    input.focus()

    isMac = navigator.platform.toUpperCase().indexOf('Mac') >= 0
  })

  function onFocusOut(e: FocusEvent) {
    chrome.runtime.sendMessage({ type: 'CLOSE', new_tab: newTab })
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      chrome.runtime.sendMessage({ type: 'CLOSE', new_tab: newTab })
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onSelectDown()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      onSelectUp()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const result = results[resultSelection]
      if (result) {
        executeAction(result.actions[0])
      }
    } else {
      queryIcon = 'search'
      lockResults = false
      resultSelection = 0
    }
  }

  function onSelectDown() {
    resultSelection = resultSelection === results.length - 1 ? 0 : resultSelection + 1
    afterSelect()
  }

  function onSelectUp() {
    resultSelection = resultSelection === 0 ? results.length - 1 : resultSelection - 1
    afterSelect()
  }

  function afterSelect() {
    const result = results[resultSelection]
    lockResults = true
    query = result.text
    queryIcon = result.icon
  }

  function executeAction(a: BasicAction) {
    if (a.type === 'url') {
      const action = a as URLAction
      chrome.tabs.create({ url: action.url })
      if (newTab) {
        setTimeout(() => {
          window.close()
        }, 100)
      }
    }
  }

  $: if (query.length === 0) {
    results = []
  } else {
    if (!lockResults) {
      results = results.filter((result) => result.type !== 'search')

      const match = isValidURL(query)
      if (match) {
        results.push({
          type: 'search',
          text: query,
          icon: 'url',
          priority: -2,
          actions: [
            {
              type: 'url',
              url: match[1] ? query : `https://${query}`,
            },
          ],
        })
        queryIcon = 'url'
      }

      results.push({
        type: 'search',
        text: query,
        icon: 'search',
        priority: -1,
        actions: [
          {
            type: 'url',
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}&sourceid=chrome&ie=UTF-8`,
          },
        ],
      })
      queryIcon = 'search'
    }
  }

  $: if (query.length > 2) {
    if (googleSuggestionTimeout) {
      clearTimeout(googleSuggestionTimeout)
    }
    if (!lockResults) {
      if (googleSuggestionAbortController) {
        googleSuggestionAbortController.abort({
          name: 'AbortError',
          message: 'Aborted by the user',
        })
        googleSuggestionAbortController = new AbortController()
      }
      googleSuggestionTimeout = setTimeout(() => {
        googleSuggestions(query)
      }, 500)
    }
  } else {
    results = results.filter((result) => result.type !== 'suggestion')
  }

  $: results = results.sort((a, b) => a.priority - b.priority).slice(0, 5)

  async function googleSuggestions(query: string) {
    let response
    try {
      response = await fetch(
        `https://www.google.com/complete/search?q=${encodeURIComponent(query)}&client=chrome-omni`,
        {
          signal: googleSuggestionAbortController.signal,
        },
      )
    } catch (e) {
      let error = e as any
      if (error?.name === 'AbortError') {
        return
      }
      console.error(error)
      return
    }
    const data = await response.json()
    let suggestions = data[1]

    results = results.filter((result) => result.type !== 'suggestion')

    for (const [i, suggestion] of suggestions.entries()) {
      results.push({
        type: 'suggestion',
        text: suggestion,
        icon: 'search',
        priority: i,
        actions: [
          {
            type: 'url',
            url: `https://www.google.com/search?q=${encodeURIComponent(suggestion)}&sourceid=chrome&ie=UTF-8`,
          },
        ],
      })
    }
  }

  function isValidURL(url: string) {
    const regex =
      /^([a-z]+:\/\/)?(localhost|(?:[0-9]{1,3}(?:\.[0-9]{1,3}){3})|(?:[-a-zA-Z0-9@:%_\+~#=]{2,256}(?:\.[-a-zA-Z0-9@:%_\+~#=]{2,256})*\.(?:[a-z]{2,6}){0,1}))(:[0-9]{0,5})?(\/([-a-zA-Z0-9@:%._\+~#=\/\?&]*))?$/gi
    return regex.exec(url)
  }

  function goToShortcuts() {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
  }
</script>

<div class="flex flex-col space-y-8 h-screen w-full items-center justify-center text-gray-800">
  {#if newTab}
    <p class="text-center text-gray-600">
      <strong>Tip:</strong> change
      <a
        class="underline"
        href="chrome://extensions/shortcuts"
        on:click|preventDefault={goToShortcuts}
      >
        Spot's shortcut</a
      >
      to your new tab shortcut (e.g. <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd>T</kbd>) to use Spot
      directly from any tab.
    </p>
  {/if}
  <div class="mx-4 h-[20.7rem] w-full max-w-2xl">
    <div
      class="divide-y divide-gray-200 rounded-xl border-[1.5px] border-gray-200 bg-white text-lg shadow-lg"
    >
      <div class="flex h-14 items-center space-x-2 p-3">
        <Icon icon={queryIcon} class="-mb-0.5 size-7 px-1.5" />
        <!-- svelte-ignore a11y-autofocus -->
        <input
          placeholder="Type to search..."
          class="w-full appearance-none outline-none"
          type="text"
          autofocus
          autocorrect="off"
          bind:this={input}
          bind:value={query}
          on:keydown={onKeyDown}
          on:focusout={onFocusOut}
        />
      </div>
      {#if results.length > 0}
        <div class="grid max-h-[17.2rem] grid-cols-1 gap-1 p-1 text-base">
          {#each results as result, i}
            <ResultRow {result} active={resultSelection == i} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
