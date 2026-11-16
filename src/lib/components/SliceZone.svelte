<script lang="ts">
	/**
	 * Renders the slices of a page (instead of SliceZone from @prismicio/svelte).
	 * Common slice fields (scripts/build-customtypes.js › COMMON_SLICE_FIELDS):
	 * - invert_colors «Seitenfarben umkehren»: wrapper swapping page text and background color
	 * Slices without these options are rendered unwrapped (no extra DOM).
	 */
	import type { ComponentType } from 'svelte';
	import InvertScope from '$lib/components/InvertScope.svelte';

	export let slices: any[] = [];
	export let components: Record<string, ComponentType>;
	export let context: unknown = undefined;
</script>

{#each slices as slice, index (slice.id ?? index)}
	{#if components[slice.slice_type]}
		{#if slice.primary?.invert_colors === true}
			<InvertScope>
				<svelte:component this={components[slice.slice_type]} {slice} {slices} {index} {context} />
			</InvertScope>
		{:else}
			<svelte:component this={components[slice.slice_type]} {slice} {slices} {index} {context} />
		{/if}
	{/if}
{/each}
