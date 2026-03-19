<script lang="ts">
	import { components } from '$lib/slices';
	import { theme } from '$lib/stores/theme';
	import type { PageData } from './$types';

	export let data: PageData;

	$: Component = components[data.sliceId as keyof typeof components];

	$: bg = $theme.headerBgColor || '#1f2937';
	$: fg = $theme.headerLinkColor || '#e5e7eb';
	$: fgMuted = $theme.headerColor || '#9ca3af';
	$: pageBg = $theme.pageBgColor || '#ffffff';
	$: pageColor = $theme.pageColor || '#111827';
</script>

<svelte:head><title>{data.sliceName} / {data.variationName} – Katalog</title></svelte:head>

<!-- Info-Leiste -->
<div
	class="sticky top-0 z-20 border-b"
	style="background-color: {pageColor}11; border-color: {pageColor}22;"
>
	<div class="flex items-center gap-3 px-5 py-2.5">
		<span class="font-semibold" style="color: {pageColor}; font-size: 16px;">{data.sliceName}</span>
		<span style="color: {pageColor}; opacity: 0.4;">/</span>
		<span style="color: {pageColor}; font-size: 16px;">{data.variationName}</span>
		{#each Object.entries(data.meta ?? {}).filter(([k]) => k !== 'Beschreibung') as [key, value]}
			<span
				class="ml-2 px-2 py-0.5 rounded font-medium"
				style="font-size: 14px; background-color: {pageColor}22; color: {pageColor};"
			>
				{key}: {value}
			</span>
		{/each}
	</div>
	{#if data.meta?.Beschreibung}
		<div
			class="px-5 py-2.5"
			style="background-color: {pageColor}11; color: {pageColor}; font-size: 18px;"
		>
			{data.meta.Beschreibung}
		</div>
	{/if}
</div>

<!-- Slice Preview -->
{#if Component}
	<div class="md:max-w-[50vw] md:mx-auto overflow-hidden">
		<svelte:component
			this={Component}
			slice={data.mockSlice}
			index={0}
			slices={[data.mockSlice]}
			context={{}}
		/>
	</div>
{:else}
	<div class="p-12 text-center text-gray-400 text-sm">
		Kein Component registriert für <code class="font-mono">{data.sliceId}</code>
	</div>
{/if}
