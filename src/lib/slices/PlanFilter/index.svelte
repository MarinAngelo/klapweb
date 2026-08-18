<script lang="ts">
	import { onDestroy } from 'svelte';
	import { planFilter } from '$lib/stores/planFilter';
	import gating from '../../../../gating.json';
	import Bounded from '$lib/components/Bounded.svelte';

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

<Bounded
	tag="div"
	yPadding="base-top"
	class={slice.primary?.sticky ? 'sticky top-0 z-10' : ''}
	style="background-color: {slice.primary?.bg_color || 'var(--page-bg-color, #fff)'}; color: {slice
		.primary?.text_color || 'var(--page-color, #000)'};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class="grid grid-cols-2 gap-6">
		<div class="flex items-center">
			<label class="size-xl">{heading}</label>
		</div>
		<div>
			<select
				class="input mt-1 p-2 block w-full rounded-md border-b focus:border-b-2 focus:outline-none focus:ring-0"
				style="background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);"
				value={$planFilter ?? ''}
				on:change={(e) => planFilter.set(e.currentTarget.value || null)}
			>
				<option value="">Alle Pläne</option>
				{#each plans as plan}
					<option value={plan.id}>{plan.label}</option>
				{/each}
			</select>
		</div>
	</div>
</Bounded>
