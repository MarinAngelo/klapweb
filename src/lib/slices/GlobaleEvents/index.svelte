<script lang="ts">
	import { onMount } from 'svelte';
	import { createClient } from '$lib/prismicio';
	import { isFilled } from '@prismicio/helpers';
	import { PrismicImage, PrismicRichText } from '@prismicio/svelte';
	import type { Content, FilledContentRelationshipField } from '@prismicio/client';

	export let slice: Content.GlobaleEventsSlice;
	console.log('GlobaleEventsSlice', slice);

	let eventDoc: Content.EventDocument | null = null;
	let loading = true;

	// Der eigentliche Event-Slice innerhalb des Event-Dokuments
	let eventSlice: Content.EventSlice | null = null;

	// Hole das referenzierte Event-Dokument
	onMount(async () => {
		if (isFilled.contentRelationship(slice.primary.events)) {
			const client = createClient();
			eventDoc = await client.getByID(slice.primary.events.id);

			// Suche nach einem Slice vom Typ "event"
			eventSlice = eventDoc.data.slices.find((s) => s.slice_type === 'event') ?? null;

			console.log('eventDoc', eventDoc);
			console.log('eventSlice', eventSlice);
		}
		loading = false;
	});

	const formatDate = (date: string | null) =>
		date ? new Intl.DateTimeFormat('de-CH', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(date)) : '';
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation} class="p-6 md:p-12">
	{#if loading}
		<p class="text-gray-500 italic">Lade Event …</p>

	{:else if eventSlice}
		<h2 class="text-3xl font-bold mb-4">{eventSlice.primary.title}</h2>

		{#if eventSlice.primary.image?.url}
			<PrismicImage field={eventSlice.primary.image} class="mb-6 rounded-xl shadow" />
		{/if}

		<div class="grid md:grid-cols-2 gap-6 mb-6">
			<div>
				<p><strong>Beginn:</strong> {formatDate(eventSlice.primary.start_date_time)}</p>
				<p><strong>Ende:</strong> {formatDate(eventSlice.primary.end_date_time)}</p>

				{#if eventSlice.primary.geopoint?.latitude && eventSlice.primary.geopoint?.longitude}
					<div class="mt-2">
						<a
							href={`https://www.google.com/maps?q=${eventSlice.primary.geopoint.latitude},${eventSlice.primary.geopoint.longitude}`}
							target="_blank"
							class="text-blue-600 underline"
							rel="noopener noreferrer"
						>
							📍 Standort auf Google Maps anzeigen
						</a>
					</div>
				{/if}
			</div>

			<div>
				{#if eventSlice.primary.description}
					<PrismicRichText field={eventSlice.primary.description} />
				{/if}
			</div>
		</div>

	{:else}
		<p class="text-red-500 italic">Kein gültiger Event-Slice im referenzierten Dokument gefunden.</p>
	{/if}
</section>
