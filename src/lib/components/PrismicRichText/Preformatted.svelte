<script lang="ts">
	export let node: any = undefined;
	import { theme } from '$lib/stores/theme';
	import { hexLuminance, shadeColor } from '$lib/utils/color';

	let copied = false;
	let codeEl: HTMLElement;

	$: bg = shadeColor(
		$theme.pageBgColor || '#ffffff',
		hexLuminance($theme.pageBgColor || '#ffffff') > 0.5 ? -10 : 10
	);

	function copy() {
		navigator.clipboard.writeText(codeEl.innerText).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}
</script>

<div class="relative mb-7 last:mb-0 group">
	<button
		on:click={copy}
		aria-label="Code kopieren"
		class="absolute top-2 right-2 z-10 rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 text-white"
	>
		{#if copied}✓{:else}
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
				<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
			</svg>
		{/if}
	</button>
	<pre
		class="rounded p-4 text-sm md:p-8 md:text-lg overflow-x-auto"
		style="background-color: {bg};"
	><code bind:this={codeEl}><slot /></code></pre>
</div>
