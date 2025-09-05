<script lang="ts">
	import { onMount } from 'svelte';
	import { createClient } from '$lib/prismicio';
	import { isFilled } from '@prismicio/helpers';
	import { SliceZone } from '@prismicio/svelte';
	import { components } from '$lib/slices';
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let slice: Content.GlobaleEventsSlice;
	console.log('GlobaleEvents Slice:', slice);

	let eventSlices: string | any[] = [];
	let loading = true;

	onMount(async () => {
		if (isFilled.contentRelationship(slice.primary.events)) {
			const client = createClient();
			const eventDoc = await client.getByID(slice.primary.events.id);

			// Alle Slices des Event-Dokuments
			eventSlices = (eventDoc.data as { slices?: any[] }).slices ?? [];
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
		<p>Lade Event …</p>
	{:else if eventSlices.length > 0}
		<SliceZone slices={eventSlices} {components} />
	{:else}
		<p class="text-red-500 italic">
			Kein gültiger Event-Slice im referenzierten Dokument gefunden.
		</p>
	{/if}
</div>
