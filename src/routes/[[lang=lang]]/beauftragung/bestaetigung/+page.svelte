<script lang="ts">
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	$: isSimulated = $page.url.searchParams.get('simulated') === 'true';
	$: method = $page.url.searchParams.get('method') ?? 'stripe';
	$: serviceLabel = $page.url.searchParams.get('label') ?? '';

	$: bgColor = get(theme).pageBgColor;
	$: pageColor = get(theme).pageColor;
	$: borderColor = get(theme).pageColor;
</script>

<svelte:head>
	<title>Bestellung bestätigt</title>
</svelte:head>

<Bounded as="section" style="background-color: {bgColor}; color: {pageColor};">

	{#if isSimulated}
		<div class="mb-8 px-4 py-3 border border-yellow-500 text-yellow-600 text-sm">
			<strong>DEV-Simulation:</strong> Zahlungsart: <code>{method}</code>
			{#if method === 'stripe'}
				— In Production würde der User nach erfolgter Stripe-Zahlung hier landen.
				<code class="block mt-1">/beauftragung/bestaetigung?session_id=&#123;CHECKOUT_SESSION_ID&#125;</code>
			{:else if method === 'rechnung'}
				— In Production wird die PDF-Rechnung per E-Mail verschickt (Resend).
			{:else if method === 'bar'}
				— In Production wird die Bestellung an Netlify Forms gesendet.
			{/if}
		</div>
	{/if}

	<Heading tag="h1">Vielen Dank für Ihre Bestellung!</Heading>

	<p class="text-lg mb-6">
		Ihre Bestellung{#if serviceLabel} <strong>{serviceLabel}</strong>{/if} ist bei uns eingegangen.
	</p>

	<div class="mb-8 p-6 border" style="border-color: {borderColor};">
		{#if method === 'rechnung'}
			<p class="font-semibold mb-2">Zahlung gegen Rechnung</p>
			<p>Ihre Rechnung wurde soeben per E-Mail versandt.</p>
			<p class="mt-2 opacity-70 text-sm">
				Bitte überweisen Sie den Betrag innerhalb von 30 Tagen auf das angegebene Konto
				und verwenden Sie die Rechnungsnummer als Zahlungsreferenz.
			</p>
		{:else if method === 'bar'}
			<p class="font-semibold mb-2">Zahlung gegen Bar</p>
			<p>Wir haben Ihre Bestellung erhalten und melden uns in Kürze zur Terminvereinbarung.</p>
			<p class="mt-2 opacity-70 text-sm">Die Zahlung erfolgt bei persönlicher Übergabe.</p>
		{:else}
			<p>Sie erhalten in Kürze eine Bestätigungs-E-Mail.</p>
			<p class="mt-2 opacity-70 text-sm">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
		{/if}
	</div>

	<a href="/" class="underline text-sm opacity-70 hover:opacity-100">Zurück zur Startseite</a>

</Bounded>
