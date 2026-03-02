import { createClient } from '$lib/prismicio';

export const prerender = false;

export interface ProductData {
	label: string;
	price: number | null;
	stripeUrl: string | null;
}

export async function load({ fetch, url, parent }) {
	const { lang } = await parent();
	const serviceUid = url.searchParams.get('service') ?? '';
	if (!serviceUid) return { product: null };
	try {
		const client = createClient({ fetch });
		const pageDoc = await client.getByUID('page', serviceUid, { lang });
		const d = pageDoc.data as Record<string, unknown>;
		const stripeLink = d.ecommerce_stripe_url as { url?: string } | null | undefined;
		return {
			product: {
				label: pageDoc.data.title
					? (pageDoc.data.title as Array<{ text: string }>)[0]?.text ?? serviceUid
					: serviceUid,
				price: (d.ecommerce_price_chf as number) ?? null,
				stripeUrl: stripeLink?.url ?? null
			} satisfies ProductData
		};
	} catch {
		return { product: null };
	}
}
