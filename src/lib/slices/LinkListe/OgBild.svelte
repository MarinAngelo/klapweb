<script lang="ts">
	import Favicon from './Favicon.svelte';

	export let src: string | null = null;
	export let alt: string = '';
	export let hostname: string = '';
	export let done: boolean = false;
</script>

{#if src}
	<img {src} {alt} class="w-full h-full object-cover" loading="lazy" decoding="async" />
{:else if done}
	<div class="w-full h-full flex items-center justify-center [opacity:0.15]">
		<Favicon domain={hostname} size={64} class="w-10 h-10" />
	</div>
{:else}
	<div
		class="w-full h-full animate-pulse [background:color-mix(in_srgb,_currentColor_8%,_transparent)]"
	></div>
{/if}
