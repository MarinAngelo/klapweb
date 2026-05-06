<script lang="ts">
	import { onDestroy } from 'svelte';
	import { planFilter } from '$lib/stores/planFilter';
	import gating from '../../../../gating.json';

	export let slice: any;
	export let slices: any[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	const plans = Object.entries(gating.plans as Record<string, { label: string }>).map(
		([id, p]) => ({ id, label: p.label })
	);

	const heading = slice.primary?.heading || 'Inhalte filtern nach Plan:';

	onDestroy(() => planFilter.set(null));
</script>

<div
	class="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b px-6 py-3"
	style="background-color: var(--page-bg-color, #fff); border-color: color-mix(in srgb, var(--page-color, #000) 15%, transparent);"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if heading}
		<label for="plan-filter" class="text-sm opacity-60">{heading}</label>
	{/if}

	<select
		id="plan-filter"
		class="rounded border px-3 py-1 text-sm"
		style="background-color: var(--page-bg-color, #fff); color: var(--page-color, #000); border-color: color-mix(in srgb, var(--page-color, #000) 30%, transparent);"
		value={$planFilter ?? ''}
		on:change={(e) => planFilter.set(e.currentTarget.value || null)}
	>
		<option value="">Alle Pläne</option>
		{#each plans as plan}
			<option value={plan.id}>{plan.label}</option>
		{/each}
	</select>
</div>
