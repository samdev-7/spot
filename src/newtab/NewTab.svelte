<script>
  import { onMount } from 'svelte'
  import Search from '../search/Search.svelte'

  onMount(() => {
    chrome.runtime.sendMessage({ type: 'NEW_TAB' })
    setTimeout(() => {
      window.close()
    }, 100)
  })
</script>

<Search newTab={true} />
