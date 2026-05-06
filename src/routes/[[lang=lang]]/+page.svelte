<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';

	import { components } from '$lib/slices';

	export let data;
	export let params: Record<string, string> = {};
</script>

<SliceZone slices={data.page.data.slices} {components} />