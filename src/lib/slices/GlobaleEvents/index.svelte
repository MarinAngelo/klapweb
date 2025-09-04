<script lang="ts">
	import { onMount } from 'svelte';
	import { createClient } from '$lib/prismicio';
	import { isFilled } from '@prismicio/helpers';
	import { SliceZone } from '@prismicio/svelte';
	import { components } from '$lib/slices';
	import type { Content } from '@prismicio/client';

	export let slice: Content.GlobaleEventsSlice;

	let eventSlices = [];
	let loading = true;

	onMount(async () => {
		if (isFilled.contentRelationship(slice.primary.events)) {
			const client = createClient();
			const eventDoc = await client.getByID(slice.primary.events.id);

			// Alle Slices des Event-Dokuments
			eventSlices = eventDoc.data.slices ?? [];
		}
		loading = false;
	});
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="p-6 md:p-12"
>
	{#if loading}
		<p class="text-gray-500 italic">Lade Event …</p>
	{:else if eventSlices.length > 0}
		<SliceZone slices={eventSlices} {components} />
	{:else}
		<p class="text-red-500 italic">
			Kein gültiger Event-Slice im referenzierten Dokument gefunden.
		</p>
	{/if}
</section>
