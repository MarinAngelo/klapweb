<script lang="ts">
    import type { Content } from '@prismicio/client';
    import Bounded from '$lib/components/Bounded.svelte';
    export let slice: Content.CodeEinbettenSlice;
</script>

<Bounded tag="section" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
    <!-- HTML-Code rendern -->
    {#each slice.primary.html_code as code}
        <div>{@html code.text}</div>
    {/each}
</Bounded>
