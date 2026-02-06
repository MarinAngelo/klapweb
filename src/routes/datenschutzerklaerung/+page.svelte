<script lang="ts">
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import AddressBlock from '$lib/components/AddressBlock.svelte';
	import { hardcodeTexts } from '$lib/i18n/hardcodeTexts';
	import type { RTNode } from '@prismicio/types';
	export let data;

	// Fallback-Text: Nur Datenschutzerklärung, keine Adresse
	const fallback: [RTNode, ...RTNode[]] = [
		{ type: 'heading2', text: 'Erhebung und Verarbeitung von Daten', spans: [] },
		{
			type: 'paragraph',
			text: 'Beim Besuch dieser Website werden Zugriffsdaten (z.B. IP-Adresse, Datum, Uhrzeit) gespeichert. Diese Daten dienen ausschließlich statistischen Zwecken und werden nicht an Dritte weitergegeben.',
			spans: []
		},
		{ type: 'heading2', text: 'Ihre Rechte', spans: [] },
		{
			type: 'paragraph',
			text: 'Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten. Kontaktieren Sie uns dazu unter der oben genannten Adresse.',
			spans: []
		}
	];

	// settings aus data holen (wird von +layout.server.ts bereitgestellt)
	const settings = data?.settings;
	const privacyField = settings?.data?.privacy_policy;

	// Nur Paragraphen mit text-Feld für die Adresse
	$: computedAddress = (settings?.data?.responsible_address ?? []).filter(
		(b) => b.type === 'paragraph' && typeof b.text === 'string'
	);
</script>

<main class="prose mx-auto py-12 px-4 sm:px-6">
	<h1 class="break-words hyphens-auto">Datenschutzerklärung</h1>
	<p>
		Diese Website verarbeitet personenbezogene Daten gemäß den gesetzlichen Bestimmungen. Weitere
		Informationen finden Sie in den folgenden Abschnitten.
	</p>
	<h2>Verantwortliche Stelle</h2>
	<AddressBlock
		responsible_person_company={settings?.data?.responsible_person_company ??
			hardcodeTexts.de.responsible_person_company}
		responsible_address={settings?.data?.responsible_address &&
		Array.isArray(settings?.data?.responsible_address) &&
		settings?.data?.responsible_address.length > 0
			? settings?.data?.responsible_address
			: [{ type: 'paragraph', text: hardcodeTexts.de.responsible_address, spans: [] }]}
		responsible_email={settings?.data?.responsible_email ??
			settings?.data?.e_mail ??
			hardcodeTexts.de.responsible_email}
	/>
	<PrismicRichText
		field={Array.isArray(privacyField) && privacyField.length > 0 ? privacyField : fallback}
	/>
</main>

<style>
	.prose {
		max-width: 65ch;
	}
	.address-block p {
		margin-bottom: 2px;
	}
</style>
