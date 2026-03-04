import { createClient } from '$lib/prismicio';
import { calcDisplayPrice, parseCurrencyCode } from '$lib/pricing';
import { fetchExchangeRates } from '$lib/utils/exchangeRates.server';

export const prerender = false;

export interface ProductData {
	label: string;
	price: number | null;
	displayAmount: number | null;
	stripeUrl: string | null;
}

export async function load({ fetch, url, parent }) {
	const { lang, settings } = await parent();
	const pageTitle: string = (settings.data as any).zusammenfassung_title?.trim() || 'Bestellübersicht';
	const baseCurrency: string =
		parseCurrencyCode((settings.data as any).invoice_currency as string) || 'CHF';
	const additionalEntries: Array<{ waehrung?: string }> =
		(settings.data as any).invoice_additional_currencies ?? [];
	const additionalCodes = additionalEntries.map((e) => parseCurrencyCode(e.waehrung)).filter(Boolean);
	const rates = await fetchExchangeRates(baseCurrency, additionalCodes);
	const serviceUid = url.searchParams.get('service') ?? '';
	if (!serviceUid) return { product: null, pageTitle, baseCurrency, additionalCodes, rates };
	try {
		const client = createClient({ fetch });
		const pageDoc = await client.getByUID('page', serviceUid, { lang });
		const d = pageDoc.data as Record<string, unknown>;
		const stripeLink = d.ecommerce_stripe_url as { url?: string } | null | undefined;
		const basePrice = (d.ecommerce_price_chf as number) ?? null;
		const discountPct = (d.ecommerce_discount_percent as number) ?? null;
		const depositPct = (d.ecommerce_deposit_percent as number) ?? null;
		const displayAmount = calcDisplayPrice(basePrice, discountPct, depositPct);
		return {
			product: {
				label: pageDoc.data.title
					? (pageDoc.data.title as Array<{ text: string }>)[0]?.text ?? serviceUid
					: serviceUid,
				price: basePrice,
				displayAmount,
				stripeUrl: stripeLink?.url ?? null
			} satisfies ProductData,
			pageTitle,
			baseCurrency,
			additionalCodes,
			rates
		};
	} catch (e) {
		console.error('[zusammenfassung] Fehler beim Laden von UID:', serviceUid, e);
		return { product: null, pageTitle, baseCurrency, additionalCodes, rates };
	}
}
