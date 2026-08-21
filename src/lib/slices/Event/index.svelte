<script lang="ts">
	import { asText } from '@prismicio/helpers';
	import { PrismicRichText, PrismicLink } from '@prismicio/svelte';
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';

	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: Content.EventSlice;
	const primary = slice.primary;

	// Animation aus CMS-Feldern mappen
	$: anim = mapAnimationFromPrimary(slice.primary);

	import { formatEventDateTime } from '$lib/utils/formatDate';

	// Datum formatieren
	const formatDateTime = (date: string | null) => formatEventDateTime(date, false);

	// Uhrzeit formatieren
	const formatTime = (date: string | null) => {
		if (!date) return '';
		return new Intl.DateTimeFormat('de-CH', {
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

	// Google Calendar Link generieren
	const getGoogleCalendarLink = ({
		title,
		start,
		end,
		description,
		location
	}: {
		title: string;
		start: string;
		end: string;
		description?: string;
		location?: string;
	}) => {
		const format = (d: string) => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, '');
		const params = new URLSearchParams({
			action: 'TEMPLATE',
			text: title,
			details: description || '',
			location: location || '',
			dates: `${format(start)}/${format(end)}`
		});
		return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
	style="color: var(--page-color)"
	class={mobileVollbreite ? 'overflow-x-clip' : ''}
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
				<PrismicRichText field={primary.description} />
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
						Zum Kalender hinzufügen (.ics)
					</PrismicLink><br />

					<PrismicLink
						field={{
							link_type: 'Web',
							url: getGoogleCalendarLink({
								title: primary.title,
								start: primary.start_date_time,
								end: primary.end_date_time,
								description: asText(primary.description),
								location: asText(primary.location_text)
							})
						}}
						target="_blank"
						data-type="prismic-link"
					>
						In Google Calendar öffnen
					</PrismicLink><br />
				{/if}
				{#if primary.location_text}
					<div class="mt-4">
						<strong>Ort:</strong>
						<PrismicRichText field={primary.location_text} />
					</div>
				{/if}
				{#if primary.geopoint?.latitude && primary.geopoint?.longitude}
					<PrismicLink
						field={{
							link_type: 'Web',
							url: `https://www.google.com/maps?q=${primary.geopoint.latitude},${primary.geopoint.longitude}`
						}}
						target="_blank"
						data-type="prismic-link"
					>
						Standort auf Google Maps anzeigen
					</PrismicLink><br />
				{/if}
				{#if primary.additional_dates.length > 0}
					{#if allDates.length > 0 && primary.additional_dates.length > 0}
						<div class="mt-4">
							<strong>Daten:</strong>
							{#each allDates as date}
								<p>
									- {date
										? new Intl.DateTimeFormat('de-CH', { dateStyle: 'long' }).format(new Date(date))
										: ''}
								</p>
							{/each}
						</div>
					{:else}
						<div class="mt-4 text-red-500">Zurzeit sind keine Durchführungen geplant</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</Bounded>
