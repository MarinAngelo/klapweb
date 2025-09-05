<script lang="ts">
	import { onMount } from 'svelte';
	import { createClient } from '$lib/prismicio';
	import { isFilled } from '@prismicio/helpers';
	import { SliceZone } from '@prismicio/svelte';
	import { components } from '$lib/slices';
	import type { Content } from '@prismicio/client';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let slice: Content.GlobaleEventsSlice;

	let eventSlices: any[] = [];
	let loading = true;

	onMount(async () => {
		if (isFilled.contentRelationship(slice.primary.events)) {
			const client = createClient();
			const eventDoc = await client.getByID(slice.primary.events.id);

			// Alle Slices des Event-Dokuments
			if ('slices' in eventDoc.data) {
				eventSlices = eventDoc.data.slices ?? [];
			} else {
				console.warn('The fetched document does not contain slices.');
			}
		}
		loading = false;
	});
</script>

<div
	style="color: {get(theme).pageColor}"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if loading}
		<div class="flex items-center justify-center gap-2 w-full">
			<span
				class="animate-spin inline-block w-5 h-5 border-2 border-t-transparent border-gray-400 rounded-full"
			></span>
		</div>
	{:else if eventSlices.length > 0}
		<SliceZone slices={eventSlices} {components} />
	{:else}
		<p class="text-red-500 italic">
			Kein gültiger Event-Slice im referenzierten Dokument gefunden.
		</p>
	{/if}
</div>
