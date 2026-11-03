<script lang="ts">
	import { page } from '$app/stores';
	import { t } from '$lib/i18n/translations';
	import { get } from 'svelte/store';
	import { isFilled } from '@prismicio/client';
	import { variables } from '$lib/stores/variables';
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	export let data: {
		confirmationTexts: { stripe: unknown; rechnung: unknown; bar: unknown };
		confirmationHeading: string | null;
		confirmationIntro: string | null;
	};

	$: isSimulated = $page.url.searchParams.get('simulated') === 'true';
	$: method = $page.url.searchParams.get('method') ?? 'stripe';
	$: serviceLabel = $page.url.searchParams.get('label') ?? '';
	$: confirmationText = data.confirmationTexts[method as 'stripe' | 'rechnung' | 'bar'] ?? null;

	// Inject service label as token so {{Dienstleistung}} works in Prismic confirmation texts
	$: variables.update((v) => ({ ...v, Dienstleistung: serviceLabel }));

	$: lang = $page.data.lang || 'de-ch';

	$: returnUrlRaw = $page.url.searchParams.get('return_url') ?? '';
	$: backHref = returnUrlRaw.startsWith('/') ? returnUrlRaw : '/';
</script>

<svelte:head>
	<title>{t('Bestellung bestätigt', lang)}</title>
</svelte:head>

<Bounded class="bg-page-bg text-page" as="section">
	{#if isSimulated}
		<div class="mb-8 px-4 py-3 border border-yellow-500 text-yellow-600 text-sm">
			<strong>DEV-Simulation:</strong> Zahlungsart: <code>{method}</code>
			{#if method === 'stripe'}
				— In Production würde der User nach erfolgter Stripe-Zahlung hier landen.
				<code class="block mt-1"
					>/beauftragung/bestaetigung?session_id=&#123;CHECKOUT_SESSION_ID&#125;</code
				>
			{:else if method === 'rechnung'}
				— In Production wird die PDF-Rechnung per E-Mail verschickt (Resend).
			{:else if method === 'bar'}
				— In Production wird die Bestellung an Netlify Forms gesendet.
			{/if}
		</div>
	{/if}

	<Heading tag="h1"
		>{data.confirmationHeading ?? t('Vielen Dank für Ihre Bestellung!', lang)}</Heading
	>

	<p class="text-lg mb-6">
		{#if data.confirmationIntro}
			{data.confirmationIntro}
		{:else if serviceLabel}{t('Ihre Bestellung {leistung} ist bei uns eingegangen.', lang).replace(
				'{leistung}',
				serviceLabel
			)}{:else}{t('Ihre Bestellung ist bei uns eingegangen.', lang)}{/if}
	</p>

	<div class="border-page mb-8 p-6 border">
		{#if isFilled.richText(confirmationText)}
			<PrismicRichText field={confirmationText} />
		{:else if method === 'rechnung'}
			<p class="font-semibold mb-2">{t('Zahlung gegen Rechnung', lang)}</p>
			<p>{t('Ihre Rechnung wurde soeben per E-Mail versandt.', lang)}</p>
			<p class="mt-2 opacity-70 text-sm">
				{t('Bitte überweisen Sie den Betrag innerhalb von 30 Tagen.', lang)}
			</p>
		{:else if method === 'bar'}
			<p class="font-semibold mb-2">{t('Zahlung gegen Bar', lang)}</p>
			<p>
				{t(
					'Wir haben Ihre Bestellung erhalten und melden uns in Kürze zur Terminvereinbarung.',
					lang
				)}
			</p>
			<p class="mt-2 opacity-70 text-sm">
				{t('Die Zahlung erfolgt bei persönlicher Übergabe.', lang)}
			</p>
		{:else}
			<p>{t('Sie erhalten in Kürze eine Bestätigungs-E-Mail.', lang)}</p>
			<p class="mt-2 opacity-70 text-sm">
				{t('Bei Fragen stehen wir Ihnen gerne zur Verfügung.', lang)}
			</p>
		{/if}
	</div>

	<a href={backHref} class="underline text-sm opacity-70 hover:opacity-100"
		>{t('Zurück zur Startseite', lang)}</a
	>
</Bounded>
