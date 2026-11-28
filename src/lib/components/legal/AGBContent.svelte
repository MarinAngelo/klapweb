<script lang="ts">
	import { _ } from '$lib/stores/i18n';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	export let data: any;

	// Sprache ermitteln
	$: lang = data?.lang || 'de-ch';
	$: settings = data?.settings;
	$: agbField = settings?.data?.agb;

	// Generated section from Settings › Terminbuchung («Kostenlos stornierbar bis»,
	// «Stornogebühr nach Ablauf») — only with the feature terminbuchung (layout data)
	$: cancelTerms = data?.bookingCancelTerms as { hours: number; feePercent: number } | null;
	$: fill = (key: string) =>
		$_(key)
			.replace('{stunden}', String(cancelTerms?.hours ?? ''))
			.replace('{prozent}', String(cancelTerms?.feePercent ?? ''));
	$: cancelParagraphs = !cancelTerms
		? []
		: !cancelTerms.hours
			? [fill('Gebuchte Termine können bis zum Terminbeginn kostenlos storniert werden.')]
			: [
					fill(
						'Gebuchte Termine können bis {stunden} Stunden vor Terminbeginn kostenlos storniert werden, online über den Link in der Buchungsbestätigung.'
					),
					cancelTerms.feePercent
						? fill(
								'Bei einer Stornierung nach Ablauf dieser Frist wird eine Stornogebühr von {prozent} % des Preises des gebuchten Angebots fällig. Bei Angeboten ohne Preis fällt keine Gebühr an.'
							)
						: fill(
								'Nach Ablauf dieser Frist ist eine Stornierung nur noch nach direkter Rücksprache möglich.'
							),
					fill('Ab Terminbeginn ist keine Stornierung mehr möglich.'),
					fill(
						'Abweichende Stornierungsbedingungen, die beim jeweiligen Angebot angegeben sind, gehen diesen Bestimmungen vor. Massgebend sind die Bedingungen zum Zeitpunkt der Buchung.'
					)
				];

	// Optionaler Fallback, falls in Prismic noch nichts steht
	$: fallback =
		lang === 'en-us'
			? [
					{
						type: 'paragraph',
						text: 'Our Terms and Conditions are currently being updated for the English version. Please contact us for further information.',
						spans: []
					}
				]
			: [
					{
						type: 'paragraph',
						text: $_('Unsere Allgemeinen Geschäftsbedingungen werden derzeit aktualisiert.'),
						spans: []
					}
				];
</script>

<main class="prose mx-auto py-12 px-4 sm:px-6">
	<h1 class="break-words hyphens-auto">
		{lang === 'en-us' ? 'Terms and Conditions' : 'Allgemeine Geschäftsbedingungen (AGB)'}
	</h1>

	<PrismicRichText field={Array.isArray(agbField) && agbField.length > 0 ? agbField : fallback} />

	{#if cancelParagraphs.length}
		<!-- Generated from the cancellation settings of the appointment booking -->
		<h2>{$_('Stornierung von Terminbuchungen')}</h2>
		{#each cancelParagraphs as paragraph}
			<p>{paragraph}</p>
		{/each}
	{/if}
</main>

<style>
	.prose {
		max-width: 65ch;
	}
</style>
