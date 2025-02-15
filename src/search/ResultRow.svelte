<script lang="ts">
  import Icon from './Icon.svelte'
  import { Result } from './searchTypes'

  export let result: Result
  export let active: boolean = false
</script>

<div class={`flex items-center space-x-2 rounded-sm p-2 py-3 ${active ? 'bg-gray-100' : ''}`}>
  <Icon icon={result.icon} class="-mb-0.5 size-7 px-1.5" />
  <p class="flex-grow">{result.text}</p>
</div>
