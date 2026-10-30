<script lang="ts">
	import { osmMarkerUrl, parseMapPoint, type MapPoint } from '$lib/mapPoint.js';
	import { resolveMapPoint } from '$lib/utils/mapUrl';
	import { onMount } from 'svelte';
	// Own wrapper: replaces {{Variables}}, theme headings/links
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { _ } from '$lib/stores/i18n';
	import { asText } from '@prismicio/helpers';
	import PrismicLink from '$lib/components/PrismicLink.svelte';
	import RichTextEmbed from '$lib/components/PrismicRichText/Embed.svelte';
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';

	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: Content.EventSlice;
	const primary = slice.primary;
	// «Kartenpunkt» (link or coordinates), fallback: old Prismic map point (geopoint)
	const anyPrimary = primary as any;
	// Google short links are resolved after mount (via our server)
	let mapPoint: MapPoint | null =
		parseMapPoint(anyPrimary.map_point) ??
		(anyPrimary.geopoint?.latitude && anyPrimary.geopoint?.longitude
			? { lat: anyPrimary.geopoint.latitude, lon: anyPrimary.geopoint.longitude, zoom: 16 }
			: null);
	onMount(async () => {
		if (!parseMapPoint(anyPrimary.map_point) && anyPrimary.map_point) {
			mapPoint = (await resolveMapPoint(anyPrimary.map_point)) ?? mapPoint;
		}
	});

	// Animation aus CMS-Feldern mappen
	$: anim = mapAnimationFromPrimary(slice.primary);

	import { formatEventDateTime, SITE_TIME_ZONE } from '$lib/utils/formatDate';

	// Datum formatieren
	const formatDateTime = (date: string | null) => formatEventDateTime(date, false);

	// Uhrzeit formatieren
	const formatTime = (date: string | null) => {
		if (!date) return '';
		return new Intl.DateTimeFormat('de-CH', {
			timeZone: SITE_TIME_ZONE,
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	};

	// .ics-Datei generieren
	const generateICS = ({
		title,
		description,
		start,
		end,
		location
	}: {
		title: string;
		description?: string;
		start: string;
		end: string;
		location?: string;
	}) => {
		const formatDate = (dateStr: string) => {
			const date = new Date(dateStr);
			return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
		};

		return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
DESCRIPTION:${description || ''}
LOCATION:${location || ''}
END:VEVENT
END:VCALENDAR`;
	};

	// reactive .ics Blob URL
	let icsUrl: string | null = null;

	$: if (primary.start_date_time && primary.end_date_time && primary.title) {
		const icsContent = generateICS({
			title: primary.title,
			description: primary.description ? asText(primary.description) : '',
			start: primary.start_date_time,
			end: primary.end_date_time,
			location: primary.location_text ? asText(primary.location_text) : ''
		});
		const blob = new Blob([icsContent], { type: 'text/calendar' });
		icsUrl = URL.createObjectURL(blob);
	}

	$: mobileVollbreite = (slice.primary as any).mobile_full_width ?? false;

	// Array mit allen Daten: start_date_time + additional_dates, nur zukünftige oder heutige
	let allDates: string[] = [];
	$: {
		const now = new Date();
		allDates = [];
		if (primary.start_date_time) {
			const startDate = new Date(primary.start_date_time);
			if (startDate >= new Date(now.toDateString())) {
				allDates.push(primary.start_date_time);
			}
		}
		if (primary.additional_dates && Array.isArray(primary.additional_dates)) {
			const additional = primary.additional_dates
				.filter((d) => d.date && new Date(d.date) >= new Date(now.toDateString()))
				.map((d) => d.date as string); // <--- Hier wird das Array zu string[]
			allDates = allDates.concat(additional);
		}
	}
</script>

<Bounded
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class="text-page {mobileVollbreite ? 'overflow-x-clip' : ''}"
>
	<div class={mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}>
		{#if primary.title}
			<h2>{primary.title}</h2>
		{/if}
		{#if primary.sub_title}
			<h3>{primary.sub_title}</h3>
		{/if}

		{#if primary.description}
			<div>
				<PrismicRichText field={primary.description} components={{ embed: RichTextEmbed }} />
			</div>
		{/if}

		<div class="grid md:grid-cols-2 gap-6 mb-6">
			<div>
				{#if primary.start_date_time}
					{#if primary.additional_dates.length > 0}
						<p><strong>Beginn:</strong> {formatTime(primary.start_date_time)}</p>
					{:else}
						<p><strong>Beginn:</strong> {formatDateTime(primary.start_date_time)}</p>
					{/if}
				{/if}
				{#if primary.end_date_time}
					{#if primary.additional_dates.length > 0}
						<p><strong>Ende:</strong> {formatTime(primary.end_date_time)}</p>
					{:else}
						<p><strong>Ende:</strong> {formatDateTime(primary.end_date_time)}</p>
					{/if}
				{/if}
				<!-- Kalender-Links -->
				{#if icsUrl}
					<PrismicLink
						field={{
							link_type: 'Web',
							url: icsUrl
						}}
						download="event.ics"
						target="_blank"
						data-type="prismic-link"
					>
						{$_('Zum Kalender hinzufügen (.ics)')}
					</PrismicLink><br />
				{/if}
				{#if primary.location_text}
					<div class="mt-4">
						<strong>{$_('Ort')}:</strong>
						<PrismicRichText field={primary.location_text} components={{ embed: RichTextEmbed }} />
					</div>
				{/if}
				{#if mapPoint}
					<PrismicLink
						field={{ link_type: 'Web', url: osmMarkerUrl(mapPoint) }}
						target="_blank"
						data-type="prismic-link"
					>
						{$_('Standort auf der Karte anzeigen')}
					</PrismicLink><br />
				{/if}
				{#if primary.additional_dates.length > 0}
					{#if allDates.length > 0 && primary.additional_dates.length > 0}
						<div class="mt-4">
							<strong>{$_('Daten')}:</strong>
							{#each allDates as date}
								<p>
									- {date
										? new Intl.DateTimeFormat('de-CH', { dateStyle: 'long' }).format(new Date(date))
										: ''}
								</p>
							{/each}
						</div>
					{:else}
						<div class="mt-4 text-red-500">{$_('Zurzeit sind keine Durchführungen geplant')}</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</Bounded>
