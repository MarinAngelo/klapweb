import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';
import { asText } from '@prismicio/client';
import { fetchExchangeRates } from '$lib/utils/exchangeRates.server';
import { parseCurrencyCode } from '$lib/pricing';

export async function load({ params, parent }) {
	const { lang, settings } = await parent();
	const client = createClient();

	try {
		// 2. Dokument über UID und die ermittelte Sprache (de-de) suchen
		const page = await client.getByUID('page', params.uid, { lang });

		// Currency config (only relevant for ecommerce pages)
		const hasPrice = (page.data as any).ecommerce_price_chf != null;
		const baseCurrency: string =
			parseCurrencyCode((settings.data as any).invoice_currency as string) || 'CHF';
		const additionalEntries: Array<{ waehrung?: string }> =
			(settings.data as any).invoice_additional_currencies ?? [];
		const additionalCodes = additionalEntries
			.map((e) => parseCurrencyCode(e.waehrung))
			.filter(Boolean);
		const rates =
			hasPrice && additionalCodes.length > 0
				? await fetchExchangeRates(baseCurrency, additionalCodes)
				: {};

		return {
			page,
			title: asText(page.data.title) || '',
			meta_title: page.data.meta_title || '',
			meta_description: page.data.meta_description,
			baseCurrency,
			additionalCodes,
			rates
		};
	} catch (e) {
		console.error(`[404] UID: ${params.uid} nicht gefunden für Sprache: ${lang}`);
		throw error(404, { message: 'Seite nicht gefunden' });
	}
}

// Hier darf entries stehen, da es eine +page.server.ts ist
/** @type {import('./$types').EntryGenerator} */
export async function entries() {
	const client = createClient();
	const pages = await client.getAllByType('page', { lang: '*' });

	return pages
		.map((page) => {
			if (page.uid === 'home') return null;
			if (page.uid === 'beauftragung') return null; // static route
			return {
				lang: page.lang,
				uid: page.uid
			};
		})
		.filter(Boolean);
}
