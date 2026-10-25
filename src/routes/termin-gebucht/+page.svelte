<script lang="ts">
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
</script>

<svelte:head><title>Termin gebucht</title></svelte:head>

<Bounded as="section" yPadding="lg">
	<div class="max-w-prose mx-auto text-center">
		<p class="size-2xl mb-8">{data.successTitle}</p>

		<div class="text-left inline-block">
			{#if titel}
				<p><strong>Angebot:</strong> {titel}</p>
			{/if}
			{#if ort}
				<p><strong>Ort:</strong> {ort}</p>
			{/if}
			{#if datum}
				<p><strong>Datum:</strong> {datum}</p>
			{/if}
			{#if uhrzeit}
				<p><strong>Zeit:</strong> {uhrzeit}{endzeit ? ' – ' + endzeit : ''} Uhr</p>
			{/if}
			{#if dauer}
				<p><strong>Dauer:</strong> {dauer} Minuten</p>
			{/if}
		</div>

		<div class="mt-8 flex flex-wrap justify-center gap-4">
			{#if gcalLink}
				<Button href={gcalLink} text="Zum Kalender hinzufügen" />
			{/if}
			{#if icsLink}
				<Button href={icsLink} text=".ics herunterladen" />
			{/if}
		</div>

		<div class="mt-8 flex flex-wrap justify-center gap-4">
			<Button href="/" text="Zurück zur Homepage" />
			<Button href={returnTo} text="Weitere Termine buchen" />
		</div>

		{#if stornoLink}
			<div class="mt-6">
				<Button href={stornoLink} text="Buchung stornieren" color="#dc2626" />
			</div>
		{/if}
	</div>
</Bounded>
