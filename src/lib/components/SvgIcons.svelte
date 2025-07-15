<script>
	export let name; // Prop für den Namen des Icons
</script>

{#if name === 'menu'}
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <line x1="5" y1="7" x2="19" y2="7" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line> <line x1="5" y1="12" x2="19" y2="12" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line> <line x1="5" y1="17" x2="19" y2="17" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line> </g></svg>
{:else if name === 'close'}
	<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5 5L19 19M5 19L19 5" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
{/if}
