<script lang="ts">
	import { _ } from '$lib/stores/i18n';
	import { page } from '$app/stores';
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import Button from '$lib/components/Button.svelte';

	export let data: { successTitle: string };

	$: q = $page.url.searchParams;
	$: titel = q.get('titel') ?? '';
	$: datum = q.get('datum') ?? '';
	$: uhrzeit = q.get('uhrzeit') ?? '';
	$: endzeit = q.get('endzeit') ?? '';
	$: dauer = q.get('dauer') ?? '';
	$: name = q.get('name') ?? '';
	$: email = q.get('email') ?? '';
	$: stornoLink = q.get('storno') ?? '';
	$: gcalLink = q.get('gcal') ?? '';
	$: icsLink = q.get('ics') ?? '';
	$: returnTo = q.get('returnTo') ?? '/';
	$: ort = q.get('ort') ?? '';
	// Map link from the booking API — only OpenStreetMap links are accepted (URL parameter)
	$: karte = (q.get('karte') ?? '').startsWith('https://www.openstreetmap.org/')
		? q.get('karte')
		: '';
</script>

<svelte:head><title>{$_('Termin gebucht')}</title></svelte:head>

<Bounded as="section" yPadding="lg">
	<div class="max-w-prose mx-auto text-center">
		<p class="size-2xl mb-8">{data.successTitle}</p>

		<div class="text-left inline-block">
			{#if titel}
				<p><strong>{$_('Angebot')}:</strong> {titel}</p>
			{/if}
			{#if ort}
				<p>
					<strong>{$_('Ort')}:</strong>
					{ort}
					{#if karte}
						· <a href={karte} target="_blank" rel="noopener noreferrer"
							>{$_('Auf der Karte anzeigen')}</a
						>
					{/if}
				</p>
			{/if}
			{#if datum}
				<p><strong>{$_('Datum')}:</strong> {datum}</p>
			{/if}
			{#if uhrzeit}
				<p><strong>{$_('Zeit')}:</strong> {uhrzeit}{endzeit ? ' – ' + endzeit : ''} {$_('Uhr')}</p>
			{/if}
			{#if dauer}
				<p><strong>{$_('Dauer')}:</strong> {dauer} {$_('Minuten')}</p>
			{/if}
		</div>

		<div class="mt-8 flex flex-wrap justify-center gap-4">
			{#if gcalLink}
				<Button href={gcalLink} text={$_('Zum Kalender hinzufügen')} />
			{/if}
			{#if icsLink}
				<Button href={icsLink} text={$_('.ics herunterladen')} />
			{/if}
		</div>

		<div class="mt-8 flex flex-wrap justify-center gap-4">
			<Button href="/" text={$_('Zurück zur Homepage')} />
			<Button href={returnTo} text={$_('Weitere Termine buchen')} />
		</div>

		{#if stornoLink}
			<div class="mt-6">
				<Button href={stornoLink} text={$_('Buchung stornieren')} color="#dc2626" />
			</div>
		{/if}
	</div>
</Bounded>
