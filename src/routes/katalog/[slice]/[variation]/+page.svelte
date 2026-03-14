<script lang="ts">
	import { components } from '$lib/slices';
	import { theme } from '$lib/stores/theme';
	import type { PageData } from './$types';

	export let data: PageData;

	$: Component = components[data.sliceId as keyof typeof components];

	$: bg = $theme.headerBgColor || '#1f2937';
	$: fg = $theme.headerLinkColor || '#e5e7eb';
	$: fgMuted = $theme.headerColor || '#9ca3af';
</script>

<svelte:head><title>{data.sliceName} / {data.variationName} – Katalog</title></svelte:head>

<!-- Info-Leiste -->
<div
	class="sticky top-0 z-20 flex items-center gap-3 px-5 py-2.5 border-b"
	style="background-color: {bg}; border-color: {fgMuted}33;"
>
	<span class="font-semibold" style="color: {fg}; font-size: 16px;">{data.sliceName}</span>
	<span style="color: {fgMuted}; opacity: 0.4;">/</span>
	<span style="color: {fgMuted}; font-size: 16px;">{data.variationName}</span>
</div>

<!-- Slice Preview -->
{#if Component}
	<svelte:component
		this={Component}
		slice={data.mockSlice}
		index={0}
		slices={[data.mockSlice]}
		context={{}}
	/>
{:else}
	<div class="p-12 text-center text-gray-400 text-sm">
		Kein Component registriert für <code class="font-mono">{data.sliceId}</code>
	</div>
{/if}
