<script lang="ts">
	import { renderableSlices } from '$lib/utils/renderableSlices';
	import { SliceZone } from '@prismicio/svelte';

	import { components } from '$lib/slices';

	export let data;
</script>

<SliceZone slices={renderableSlices(data.page.data.slices)} {components} />
