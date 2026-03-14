<script lang="ts">
	import { components } from '$lib/slices';
	import type { PageData } from './$types';

	export let data: PageData;

	$: Component = components[data.sliceId as keyof typeof components];
</script>

<svelte:head><title>{data.sliceName} / {data.variationName} – Katalog</title></svelte:head>

<!-- Info-Leiste -->
<div
	class="sticky top-0 z-20 flex items-center gap-3 px-5 py-2.5 bg-white/95 backdrop-blur border-b border-gray-200 text-sm"
>
	<span class="font-semibold text-gray-900">{data.sliceName}</span>
	<span class="text-gray-300">/</span>
	<span class="text-gray-600">{data.variationName}</span>
	<span class="ml-auto font-mono text-xs text-gray-400"
		>{data.sliceId} · {data.variationId}</span
	>
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
