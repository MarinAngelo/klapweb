<script lang="ts">
    import { SliceZone } from '@prismicio/svelte';
    import { components } from '$lib/slices';

    export let slices; // Die Slices von der Seite
    export let prismicTheme; // Die prismicTheme-Daten

    function resolve(slice) {
        const component = components[slice.slice_type];
        if (!component) {
            return components.default;
        }
        return component;
    }
</script>

{#each slices as slice}
    <svelte:component this={resolve(slice)} {slice} {prismicTheme} />
{/each}