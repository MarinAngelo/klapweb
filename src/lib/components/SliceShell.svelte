<script lang="ts">
	/**
	 * Per-slice wrapper of SliceZone for the common slice fields (no DOM of its own):
	 * - y_padding «Vertikaler innerer Abstand» → context for the slice's outermost Bounded
	 * - invert_colors «Seitenfarben umkehren» → InvertScope (only then an extra element)
	 */
	import InvertScope from '$lib/components/InvertScope.svelte';
	import { provideSliceSpacing } from '$lib/utils/sliceSpacing';

	export let slice: { primary?: Record<string, any> };

	provideSliceSpacing(slice.primary?.y_padding);
</script>

{#if slice.primary?.invert_colors === true}
	<InvertScope><slot /></InvertScope>
{:else}
	<slot />
{/if}
