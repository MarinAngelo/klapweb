<script lang="ts">
	import { onMount } from 'svelte';
	import { createClient } from '$lib/prismicio';
	import { isFilled } from '@prismicio/helpers';
	import { filter, asHTML } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';

	import { page } from '$app/stores';
	import { _ } from '$lib/stores/i18n';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
	import { convertNumber } from '$lib/utils/convertNumber';
	import { formatEventDateTime, formatEventDateRange } from '$lib/utils/formatDate';
	import { reveal } from '$lib/actions/reveal';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import GoogleMap from '$lib/components/GoogleMap.svelte';

	export let slice: any;
	const p = slice.primary ?? ({} as any);

	$: anim = mapAnimationFromPrimary(slice.primary);

	let events: Record<string, any>[] = [];
	let parentEvent: Record<string, any> | null = null;
	let parentEventUid = '';
	let seriesName = '';
	let loading = true;
	let ticketCount: number | null = null;
	let ticketMax: number | null = null;
	$: isFullyBooked =
		ticketCount !== null && ticketMax !== null && ticketMax > 0 && ticketCount >= ticketMax;
	let showRegistrationModal = false;
	let selectedEvent: Record<string, any> | null = null;

	function openModal(ev?: Record<string, any>) {
		selectedEvent = ev ?? null;
		showRegistrationModal = true;
	}

	function printDirectionsPdf(title: string, directions: any[]) {
		const html = asHTML({ value: directions } as any) ?? '';
		const win = window.open('', '_blank');
		if (!win) return;
		win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${title}</title>
<style>body{font-family:sans-serif;max-width:720px;margin:2cm auto;font-size:14px;line-height:1.6}h1{font-size:1.4em;margin-bottom:1em}@media print{body{margin:1cm}}</style>
</head><body><h1>${title}</h1>${html}</body></html>`);
		win.document.close();
		win.focus();
		win.print();
	}

	// Anmelde-Kontaktdaten: Kind-spezifisch (individual_*) oder Eltern-Fallback
	function registrationEmail(ev: Record<string, any> | null): string {
		return ev?.individual_registration_email || parentEvent?.registration_email || '';
	}
	function registrationWhatsapp(ev: Record<string, any> | null): string {
		return ev?.individual_registration_whatsapp || parentEvent?.registration_whatsapp || '';
	}
	function registrationTelegram(ev: Record<string, any> | null): string {
		return ev?.individual_registration_telegram || parentEvent?.registration_telegram || '';
	}

	// Anmeldetext: null = alle Termine (Parent-Button), ev = Einzeltermin
	function buildRegistrationText(ev: Record<string, any> | null): string {
		const eventName = parentEvent?.title || '';
		if (ev === null) {
			// Alle Termine
			const tpl =
				parentEvent?.registration_text_all ||
				`Hallo, ich möchte mich für alle Termine von "{{Event-Name}}" anmelden.`;
			return tpl.replace(/\{\{Event-Name\}\}/g, eventName);
		} else {
			// Einzeltermin
			const dateStr = formatEventDateTime(ev.start_date, false, $page.data.lang || 'de-CH');
			const tpl =
				parentEvent?.registration_text_single ||
				`Hallo, ich möchte mich für den Termin vom {{Datum}} von "{{Event-Name}}" anmelden.`;
			return tpl.replace(/\{\{Datum\}\}/g, dateStr).replace(/\{\{Event-Name\}\}/g, eventName);
		}
	}

	function isFuture(ts: string | null | undefined): boolean {
		if (!ts) return true;
		return new Date(ts) >= new Date();
	}

	// Berechnet Wiederholungs-Termine aus dem Eltern-Event
	function expandRecurrence(ev: Record<string, any>): Record<string, any>[] {
		if (
			!ev.start_date ||
			!ev.recurrence ||
			ev.recurrence === 'Einmalig' ||
			ev.recurrence === 'Unregelmässig'
		) {
			return [ev];
		}
		const start = new Date(ev.start_date);
		const endRef = ev.end_date ? new Date(ev.end_date) : null;
		const duration = endRef ? endRef.getTime() - start.getTime() : 0;
		const count = ev.series_total_count || 1;
		const seriesEnd = ev.series_end_date ? new Date(ev.series_end_date) : null;
		const exceptions = String(ev.series_exceptions ?? '')
			.split(',')
			.map((s: string) => s.trim())
			.filter(Boolean);

		const results: Record<string, any>[] = [];
		const cur = new Date(start);
		while (results.length < count) {
			if (seriesEnd && cur > seriesEnd) break;
			const iso = cur.toISOString();
			const isException = exceptions.some((ex: string) => ex.startsWith(iso.slice(0, 10)));
			if (!isException) {
				results.push({
					...ev,
					start_date: iso,
					end_date: duration ? new Date(cur.getTime() + duration).toISOString() : ev.end_date
				});
			}
			const prev = cur.getTime();
			switch (ev.recurrence) {
				case 'Täglich':
					cur.setDate(cur.getDate() + 1);
					break;
				case 'Wöchentlich':
					cur.setDate(cur.getDate() + 7);
					break;
				case 'Zweiwöchentlich':
					cur.setDate(cur.getDate() + 14);
					break;
				case 'Monatlich':
					cur.setMonth(cur.getMonth() + 1);
					break;
				case 'Jährlich':
					cur.setFullYear(cur.getFullYear() + 1);
					break;
				default:
					break;
			}
			if (cur.getTime() === prev) break; // Sicherheits-Exit
		}
		return results;
	}

	// Merged Kind-Daten über Eltern — Kind-Felder überschreiben nur wenn explizit gesetzt
	function mergeChildOverParent(
		parent: Record<string, any>,
		child: Record<string, any>
	): Record<string, any> {
		const merged = { ...parent };
		for (const key of Object.keys(child)) {
			const val = child[key];
			if (val === null || val === undefined || val === '') continue;
			if (Array.isArray(val) && val.length === 0) continue;
			merged[key] = val;
		}
		return merged;
	}

	onMount(async () => {
		if (isFilled.contentRelationship(p.events)) {
			try {
				const client = createClient();
				const lang = $page.data.lang;

				// Eltern-Event laden (enthält alle Basis-Infos + Wiederholungsregeln)
				const parentDoc = await client
					.getByID(p.events.id, { lang })
					.catch(() => client.getByID(p.events.id).catch(() => null));
				if (!parentDoc?.data) {
					loading = false;
					return;
				}
				const parent = parentDoc.data as Record<string, any>;
				parentEvent = parent;
				parentEventUid = parentDoc.uid ?? '';
				seriesName = parent.series_name || parent.title || '';

				// Ticket-Count laden wenn Checkout-Flow aktiv
				if (parentDoc.uid && parent.use_checkout_flow) {
					fetch(`/api/event-ticket?uid=${encodeURIComponent(parentDoc.uid)}`)
						.then((r) => r.json())
						.then((d: { count?: number; maxParticipants?: number | null }) => {
							ticketCount = d.count ?? 0;
							ticketMax = d.maxParticipants ?? null;
						})
						.catch(() => {});
				}

				// Kind-Events laden (enthalten Datum + Wiederholungsregeln)
				let childDocs = await client
					.getAllByType('event', {
						lang,
						filters: [filter.at('my.event.parent_event', p.events.id)],
						orderings: [{ field: 'my.event.start_date', direction: 'asc' }]
					})
					.catch(() => [] as any[]);
				if (!childDocs.length) {
					childDocs = await client
						.getAllByType('event', {
							lang: '*',
							filters: [filter.at('my.event.parent_event', p.events.id)],
							orderings: [{ field: 'my.event.start_date', direction: 'asc' }]
						})
						.catch(() => []);
				}

				// Jedes Kind-Event expandieren (Wiederholungsregeln kommen vom Kind)
				// Eltern liefert Basis-Infos (Fallback wenn Kind-Feld leer)
				events = childDocs
					.flatMap((d: any) => expandRecurrence(d.data))
					.map((e: any) => mergeChildOverParent(parent, e))
					.filter((e: any) => isFuture(e.start_date));
				console.log(
					'[GlobaleEvents] events:',
					events.map((e: any) => ({ start: e.start_date, end: e.end_date }))
				);
			} catch (e) {
				console.warn('Serien-Events konnten nicht geladen werden.', e);
			} finally {
				loading = false;
			}
		} else {
			loading = false;
		}
	});

	const statusColor: Record<string, string> = {
		Geplant: 'bg-gray-100 text-gray-600',
		Bestätigt: 'bg-green-100 text-green-700',
		Abgesagt: 'bg-red-100 text-red-700',
		Verschoben: 'bg-yellow-100 text-yellow-700',
		Ausgebucht: 'bg-orange-100 text-orange-700'
	};
</script>

<Bounded
	animate={anim.animate}
	animationOptions={anim.options}
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="overflow-x-clip"
>
	{#if loading}
		<div class="flex items-center justify-center py-10">
			<span
				class="animate-spin inline-block w-5 h-5 border-2 border-t-transparent border-current rounded-full"
			></span>
		</div>
	{:else if parentEvent}
		<!-- ── OBERER BEREICH: Globale Infos vom Eltern-Event ── -->
		{#if isFilled.image(parentEvent.image)}
			<div class="aspect-[16/7] overflow-hidden -mx-6" style="width: calc(100% + 3rem)">
				<PrismicImage field={parentEvent.image} class="w-full h-full object-cover" />
			</div>
		{/if}

		<div class="flex flex-col gap-8">
			<!-- Typ -->
			{#if parentEvent.event_type}
				<div>
					<span class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500"
						>{parentEvent.event_type}</span
					>
				</div>
			{/if}

			<!-- Status: absolut oben rechts, über dem Bild falls vorhanden -->
			<!-- Status wurde nach Details verschoben -->

			<!-- Titel & Untertitel -->
			<div>
				<h2 class="mt-0 mb-1">{parentEvent.title ?? ''}</h2>
				{#if parentEvent.subtitle}
					<p class="opacity-70 mb-0">{parentEvent.subtitle}</p>
				{/if}
			</div>

			<!-- Beschreibung -->
			{#if parentEvent.description?.length}
				<div class="opacity-80">
					<PrismicRichText field={parentEvent.description} />
				</div>
			{/if}

			<!-- Kurzbeschreibung -->
			{#if parentEvent.short_description?.length}
				<div class="opacity-80">
					<PrismicRichText field={parentEvent.short_description} />
				</div>
			{/if}

			<hr style="border-color: color-mix(in srgb, var(--page-color) 10%, transparent)" />

			<!-- Veranstalter & Kontakt -->
			{#if parentEvent.organizer || parentEvent.contact_email || parentEvent.contact_phone || parentEvent.event_language || parentEvent.target_audience || parentEvent.min_age || parentEvent.accessibility_info || parentEvent.additional_info?.length || (parentEvent.status && parentEvent.status !== 'Kein')}
				{#if parentEvent.status && parentEvent.status !== 'Kein'}
					<div class="flex items-center gap-2">
						<span class="opacity-50 text-sm">{$_('Status')}:</span>
						<span
							class="px-2.5 py-1 rounded-full text-sm font-medium {statusColor[
								parentEvent.status
							] ?? 'bg-gray-100 text-gray-600'}">{$_(parentEvent.status)}</span
						>
					</div>
				{/if}
				{#if parentEvent.organizer || parentEvent.contact_email || parentEvent.contact_phone}
					<div class="opacity-60 flex flex-wrap gap-3">
						{#if parentEvent.organizer}
							<span>
								{$_('Veranstalter')}:
								{#if isFilled.link(parentEvent.organizer_url)}
									<a
										href={parentEvent.organizer_url.url}
										target="_blank"
										rel="noopener"
										class="underline">{parentEvent.organizer}</a
									>
								{:else}
									{parentEvent.organizer}
								{/if}
							</span>
						{/if}
						{#if parentEvent.contact_email}<a
								href="mailto:{parentEvent.contact_email}"
								class="underline">{parentEvent.contact_email}</a
							>{/if}
						{#if parentEvent.contact_phone}<span>{parentEvent.contact_phone}</span>{/if}
					</div>
				{/if}

				<!-- Weitere Details -->
				{#if parentEvent.event_language || parentEvent.target_audience || parentEvent.min_age || parentEvent.accessibility_info || parentEvent.max_participants || parentEvent.min_participants}
					{@const detailCount = [
						parentEvent.event_language,
						parentEvent.target_audience,
						parentEvent.min_age,
						parentEvent.accessibility_info,
						parentEvent.max_participants,
						parentEvent.min_participants
					].filter(Boolean).length}
					<ul
						class="opacity-60 text-sm flex flex-col gap-1 {detailCount === 1
							? 'list-none pl-0'
							: 'list-disc pl-4'}"
					>
						{#if parentEvent.event_language}<li>
								<strong>{$_('Sprache')}</strong>: {parentEvent.event_language}
							</li>{/if}
						{#if parentEvent.target_audience}<li>
								<strong>{$_('Zielgruppe')}</strong>: {parentEvent.target_audience}
							</li>{/if}
						{#if parentEvent.min_age}<li>
								<strong>{$_('Mindestalter')}</strong>: {parentEvent.min_age}
							</li>{/if}
						{#if parentEvent.max_participants}<li>
								<strong>{$_('Max. Teilnehmer')}</strong>: {parentEvent.max_participants}
							</li>{/if}
						{#if parentEvent.min_participants}<li>
								<strong>{$_('Mind. Teilnehmer')}</strong>: {parentEvent.min_participants}
							</li>{/if}
						{#if parentEvent.accessibility_info}<li>
								<strong>♿</strong>
								{parentEvent.accessibility_info}
							</li>{/if}
					</ul>
				{/if}

				<!-- Weitere Hinweise -->
				{#if parentEvent.additional_info?.length}
					<div class="opacity-70 text-sm">
						<PrismicRichText field={parentEvent.additional_info} />
					</div>
				{/if}

				<hr style="border-color: color-mix(in srgb, var(--page-color) 10%, transparent)" />
			{/if}

			<!-- Datum & Ort (gruppiert) -->
			<div class="flex flex-col gap-3">
				<!-- Datum & Zeit (aus Eltern-Event, falls gesetzt) -->
				{#if parentEvent.start_date}
					{@const dateRange = formatEventDateRange(
						parentEvent.start_date,
						parentEvent.end_date,
						false,
						$page.data.lang || 'de-CH',
						$_('bis')
					)}
					<div class="flex items-start gap-2">
						<span class="mt-0.5 shrink-0">📅</span>
						<div>
							<div>{dateRange}</div>
							{#if parentEvent.timezone}
								<div class="opacity-60">{parentEvent.timezone}</div>
							{/if}
							{#if parentEvent.doors_open}
								<div class="opacity-60">{$_('Einlass ab')} {parentEvent.doors_open}</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Ort -->
				{#if parentEvent.online_event}
					<div class="flex items-center gap-2">
						<span class="shrink-0">🌐</span>
						<span>{$_('Online-Veranstaltung')}</span>
						{#if isFilled.link(parentEvent.online_url)}
							<a
								href={parentEvent.online_url.url}
								target="_blank"
								rel="noopener"
								class="underline ml-1"
								style="color: var(--page-link-color)">Link</a
							>
						{/if}
					</div>
				{:else if parentEvent.location_name || parentEvent.location_city}
					{@const locationLine = [
						parentEvent.location_name,
						parentEvent.location_address,
						`${parentEvent.location_zip ?? ''} ${parentEvent.location_city ?? ''}`.trim(),
						parentEvent.location_country
					]
						.filter(Boolean)
						.join(', ')}
					<div class="flex items-start gap-2">
						<span class="mt-0.5 shrink-0">📍</span>
						<span>{locationLine}</span>
					</div>
				{/if}

				<!-- Website -->
				{#if isFilled.link(parentEvent.website)}
					<div class="flex items-center gap-2">
						<span class="shrink-0">🔗</span>
						<a
							href={parentEvent.website.url}
							target={parentEvent.website.target ?? '_blank'}
							rel="noopener"
							class="underline"
							style="color: var(--page-link-color)">{parentEvent.website.url}</a
						>
					</div>
				{/if}

				<!-- Wegbeschreibung -->
				{#if parentEvent.directions?.length}
					<details
						class="rounded overflow-hidden"
						style="border: 1px solid color-mix(in srgb, var(--page-color) 15%, transparent);"
					>
						<summary class="flex items-center justify-between px-3 py-2 cursor-pointer list-none">
							<span>{$_('Wegbeschreibung')}</span>
							<span class="text-xs opacity-60">▾</span>
						</summary>
						<div
							class="px-3 pb-3 pt-2 opacity-80"
							style="border-top: 1px solid color-mix(in srgb, var(--page-color) 8%, transparent);"
						>
							<PrismicRichText field={parentEvent.directions} />
							{#if parentEvent.directions_pdf_button}
								<Button
									text={$_('Als PDF herunterladen')}
									size="sm"
									mb={false}
									on:click={() =>
										printDirectionsPdf(
											parentEvent?.title ?? $_('Wegbeschreibung'),
											parentEvent?.directions ?? []
										)}
								/>
							{/if}
						</div>
					</details>
				{/if}
				{#if parentEvent.location_map_url}
					<div class="-mx-6">
						<GoogleMap
							mapUrl={parentEvent.location_map_url}
							mapHeight={parentEvent.map_height || 250}
							mapOpacity={convertNumber(parentEvent.opacity ?? 0)}
							roundCorners={false}
						/>
					</div>
				{/if}
			</div>

			<hr style="border-color: color-mix(in srgb, var(--page-color) 10%, transparent)" />

			<!-- Preis -->
			{#if parentEvent.is_free || parentEvent.price_text?.length || parentEvent.ticket_price_chf}
				<div class="flex flex-wrap items-center gap-2">
					{#if parentEvent.is_free}
						<span class="font-medium">{$_('Kostenlos')}</span>
					{:else if parentEvent.use_checkout_flow && parentEvent.ticket_price_chf}
						<span class="font-medium">CHF {parentEvent.ticket_price_chf}</span>
					{:else if parentEvent.price_text?.length}
						<PrismicRichText field={parentEvent.price_text} />
					{/if}
					{#if parentEvent.registration_required}
						<span class="opacity-60">· {$_('Anmeldung erforderlich')}</span>
					{/if}
				</div>
			{/if}

			<!-- Checkout-Flow oder klassische Anmeldung -->
			{#if parentEvent.use_checkout_flow}
				<div>
					{#if isFullyBooked}
						<span
							class="inline-block rounded-full px-4 py-2 text-sm font-semibold {statusColor[
								'Ausgebucht'
							]}">{$_('Ausgebucht')}</span
						>
					{:else}
						<Button
							link={{
								url: `/beauftragung?dienstleistung=${encodeURIComponent(parentEventUid)}&event_checkout=true${$page.data?.page?.data?.landing_page ? '&no_chrome=true' : ''}`,
								link_type: 'Web'
							}}
							text={parentEvent.ticket_button_label || $_('Ticket')}
						/>
					{/if}
				</div>
			{:else if parentEvent.registration_email || parentEvent.registration_whatsapp || parentEvent.registration_telegram}
				<div>
					<Button link={undefined} text={$_('Anmelden')} on:click={() => openModal()} />
				</div>
			{/if}

			<!-- ── UNTERER BEREICH: Termine ── -->
			{#if events.length}
				<div
					class="pt-4 border-t flex flex-col gap-3"
					style="border-color: color-mix(in srgb, var(--page-link-color) 12.5%, transparent)"
				>
					<h3 class="mt-0 mb-1">{$_('Termine')}</h3>

					{#each events as ev}
						{@const dateRange = formatEventDateRange(
							ev.start_date,
							ev.end_date,
							false,
							$page.data.lang || 'de-CH',
							$_('bis')
						)}

						<div
							class="flex flex-wrap items-start gap-4 py-3 border-b last:border-b-0"
							style="border-color: color-mix(in srgb, var(--page-link-color) 6.25%, transparent)"
						>
							<!-- Status -->
							{#if ev.status && ev.status !== 'Bestätigt' && ev.status !== 'Kein'}
								<span
									class="shrink-0 px-2 py-0.5 rounded-full font-medium {statusColor[ev.status] ??
										'bg-gray-100 text-gray-600'}">{$_(ev.status)}</span
								>
							{/if}

							<!-- Datum & Zeit -->
							<div class="flex items-start gap-2 grow">
								<span class="shrink-0 mt-0.5">📅</span>
								<div>
									{#if dateRange}
										<div>{dateRange}</div>
										{#if ev.timezone}
											<div class="opacity-60">{ev.timezone}</div>
										{/if}
										{#if ev.doors_open}
											<div class="opacity-60">{$_('Einlass ab')} {ev.doors_open}</div>
										{/if}
									{:else}
										<div class="opacity-40">{$_('Datum noch nicht festgelegt')}</div>
									{/if}
								</div>
							</div>

							<!-- Preis -->
							{#if ev.individually_bookable && (ev.individual_is_free || ev.individual_price_text?.length)}
								<div class="shrink-0 opacity-70">
									{#if ev.individual_is_free}
										{$_('Kostenlos')}
									{:else}
										<PrismicRichText field={ev.individual_price_text} />
									{/if}
								</div>
							{:else if !ev.individually_bookable && (ev.is_free || ev.price_text?.length)}
								<div class="shrink-0 opacity-70">
									{#if ev.is_free}
										{$_('Kostenlos')}
									{:else}
										<PrismicRichText field={ev.price_text} />
									{/if}
								</div>
							{/if}

							<!-- Ticket-Button oder Einzel-Anmelden -->
							{#if ev.individually_bookable}
								{@const hasIndividualContact =
									registrationEmail(ev) || registrationWhatsapp(ev) || registrationTelegram(ev)}
								{#if isFilled.link(ev.individual_ticket_url)}
									\<Button link={ev.individual_ticket_url} text={$_('Tickets')} size="sm" />
								{:else if hasIndividualContact}
									<Button
										link={undefined}
										text={$_('Anmelden')}
										size="sm"
										on:click={() => openModal(ev)}
									/>
								{/if}
							{:else if isFilled.link(ev.ticket_url)}
								<Button
									link={ev.ticket_url}
									text={ev.registration_required ? $_('Anmelden') : $_('Tickets')}
									size="sm"
								/>
							{:else if registrationEmail(ev) || registrationWhatsapp(ev) || registrationTelegram(ev)}
								<Button
									link={undefined}
									text={$_('Anmelden')}
									size="sm"
									on:click={() => openModal(ev)}
								/>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if !isFilled.contentRelationship(p.events) && $page.url.hostname === 'localhost'}
		<div class="p-4 border border-dashed border-gray-300 text-center opacity-40">
			[Globale Events: Kein Serien-Dokument verknüpft]
		</div>
	{:else if isFilled.contentRelationship(p.events) && $page.url.hostname === 'localhost'}
		<div class="p-4 border border-dashed border-gray-300 text-center opacity-40">
			[Globale Events: Keine kommenden Termine gefunden]
		</div>
	{/if}

	<!-- Anmeldungs-Modal -->
	{#if showRegistrationModal && parentEvent}
		{@const modalEmail = registrationEmail(selectedEvent)}
		{@const modalWhatsapp = registrationWhatsapp(selectedEvent)}
		{@const modalTelegram = registrationTelegram(selectedEvent)}
		{@const modalTitle = selectedEvent?.title || parentEvent.title || ''}
		{@const modalRegistrationText = buildRegistrationText(selectedEvent)}
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div
			class="fixed inset-0 flex items-center justify-center z-50"
			style="background-color: rgba(0,0,0,0.5);"
			on:click|self={() => (showRegistrationModal = false)}
			on:keydown={(e) => e.key === 'Escape' && (showRegistrationModal = false)}
			role="dialog"
			aria-modal="true"
		>
			<div
				class="rounded-xl shadow-xl p-8 max-w-sm w-full mx-4 flex flex-col gap-4"
				style="background-color: var(--page-bg-color); color: var(--page-color); border: 1px solid color-mix(in srgb, var(--page-link-color) 12.5%, transparent)"
			>
				<h3 class="mt-0 mb-0">{$_('Anmeldung')}</h3>
				<p class="opacity-70 mb-0">{$_('Wähle deine bevorzugte Methode zur Anmeldung:')}</p>

				<div class="flex flex-col gap-3">
					{#if modalEmail}
						<a
							href="mailto:{modalEmail}?subject=Anmeldung: {modalTitle}&body={encodeURIComponent(
								modalRegistrationText
							)}"
							class="flex items-center gap-3 px-4 py-3 rounded-lg border transition-opacity hover:opacity-80"
							style="border-color: color-mix(in srgb, var(--page-link-color) 25%, transparent)"
						>
							<span class="text-xl">✉️</span>
							<div>
								<div class="font-medium">{$_('Per E-Mail')}</div>
								<div class="opacity-60">{modalEmail}</div>
							</div>
						</a>
					{/if}

					{#if modalWhatsapp}
						{@const waNumber = modalWhatsapp.replace(/\D/g, '')}
						{@const waText = encodeURIComponent(modalRegistrationText)}
						<a
							href="https://wa.me/{waNumber}?text={waText}"
							target="_blank"
							rel="noopener"
							class="flex items-center gap-3 px-4 py-3 rounded-lg border transition-opacity hover:opacity-80"
							style="border-color: color-mix(in srgb, var(--page-link-color) 25%, transparent)"
						>
							<span class="text-xl">💬</span>
							<div>
								<div class="font-medium">{$_('Per WhatsApp')}</div>
								<div class="opacity-60">{modalWhatsapp}</div>
							</div>
						</a>
					{/if}

					{#if modalTelegram}
						{@const tgHandle =
							modalTelegram.startsWith('@') || modalTelegram.startsWith('+')
								? modalTelegram
								: '@' + modalTelegram}
						{@const tgTarget = modalTelegram.startsWith('+')
							? 'https://t.me/' + modalTelegram.replace(/\D/g, '')
							: 'https://t.me/' + modalTelegram.replace(/^@/, '')}
						{@const tgText = encodeURIComponent(modalRegistrationText)}
						<a
							href="{tgTarget}?text={tgText}"
							target="_blank"
							rel="noopener"
							class="flex items-center gap-3 px-4 py-3 rounded-lg border transition-opacity hover:opacity-80"
							style="border-color: color-mix(in srgb, var(--page-link-color) 25%, transparent)"
						>
							<span class="text-xl">✈️</span>
							<div>
								<div class="font-medium">{$_('Per Telegram')}</div>
								<div class="opacity-60">{tgHandle}</div>
							</div>
						</a>
					{/if}
				</div>

				<Button
					link={undefined}
					text={$_('Schliessen')}
					on:click={() => (showRegistrationModal = false)}
				/>
			</div>
		</div>
	{/if}
</Bounded>
