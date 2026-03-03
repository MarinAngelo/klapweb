import { createClient } from '$lib/prismicio';

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
	const serviceUid = url.searchParams.get('service') ?? '';
	if (!serviceUid) return { product: null, pageTitle };
	try {
		const client = createClient({ fetch });
		const pageDoc = await client.getByUID('page', serviceUid, { lang });
		const d = pageDoc.data as Record<string, unknown>;
		const stripeLink = d.ecommerce_stripe_url as { url?: string } | null | undefined;
		const basePrice = (d.ecommerce_price_chf as number) ?? null;
		const discountPct = (d.ecommerce_discount_percent as number) ?? null;
		const depositPct = (d.ecommerce_deposit_percent as number) ?? null;
		let displayAmount: number | null = null;
		if (basePrice != null) {
			const afterDiscount = discountPct != null ? basePrice * (1 - discountPct / 100) : basePrice;
			if (depositPct != null) displayAmount = Math.round(afterDiscount * depositPct / 100 * 100) / 100;
			else if (discountPct != null) displayAmount = Math.round(afterDiscount * 100) / 100;
			else displayAmount = basePrice;
		}
		return {
			product: {
				label: pageDoc.data.title
					? (pageDoc.data.title as Array<{ text: string }>)[0]?.text ?? serviceUid
					: serviceUid,
				price: basePrice,
				displayAmount,
				stripeUrl: stripeLink?.url ?? null
			} satisfies ProductData,
			pageTitle
		};
	} catch (e) {
		console.error('[zusammenfassung] Fehler beim Laden von UID:', serviceUid, e);
		return { product: null, pageTitle };
	}
}
