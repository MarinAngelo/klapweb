<script lang="ts">
    import EnhancedSliceZone from '$lib/components/EnhancedSliceZone.svelte';

    export let data;
</script>

<EnhancedSliceZone slices={data.page.data.slices} theme={data.theme} />