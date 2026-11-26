<script lang="ts">
	/**
	 * Renders the slices of a page (instead of SliceZone from @prismicio/svelte).
	 * Common slice fields (scripts/build-customtypes.js › COMMON_SLICE_FIELDS) via SliceShell:
	 * - invert_colors «Seitenfarben umkehren», y_padding «Vertikaler innerer Abstand»
	 */
	import type { ComponentType } from 'svelte';
	import SliceShell from '$lib/components/SliceShell.svelte';

	export let slices: any[] = [];
	export let components: Record<string, ComponentType>;
	export let context: unknown = undefined;
</script>

{#each slices as slice, index (slice.id ?? index)}
	{#if components[slice.slice_type]}
		<SliceShell {slice}>
			<svelte:component this={components[slice.slice_type]} {slice} {slices} {index} {context} />
		</SliceShell>
	{/if}
{/each}
