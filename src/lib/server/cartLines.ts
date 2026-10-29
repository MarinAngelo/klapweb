import { calcDisplayPrice } from '$lib/pricing';
import type { CartItemRef } from '$lib/utils/cartSpec';

/**
 * Resolves cart references to checkout lines with server-side prices.
 * - leistung: field "Preis exkl. MwSt. (CHF)", always one-time; without price → skipped
 * - page: package page with "E-Commerce aktiv" — price incl. discount/deposit like the
 *   single checkout, followed by its mandatory add-ons (Zusatzleistungen)
 */

export type CheckoutLine = {
	label: string;
	/** Display amount in the base currency (null = on request) */
	price: number | null;
	billingType: string | null;
	/** main = cart item (discount codes apply), addon = mandatory add-on of a package */
	kind: 'main' | 'addon';
};

type Client = {
	getByUID: (type: any, uid: string, params?: { lang?: string }) => Promise<{ data: unknown }>;
};

const titleOf = (data: Record<string, unknown>, fallback: string) =>
	(data.title as Array<{ text?: string }> | undefined)?.[0]?.text || fallback;

async function resolvePage(
	client: Client,
	uid: string,
	lang: string | undefined,
	globalDepositPct: number | null
): Promise<CheckoutLine[]> {
	const doc = await client.getByUID('page', uid, lang ? { lang } : {});
	const d = doc.data as Record<string, unknown>;
	if (d.ecommerce_active !== true) return [];

	const main: CheckoutLine = {
		label: titleOf(d, uid),
		price: calcDisplayPrice(
			(d.ecommerce_price_chf as number) ?? null,
			(d.ecommerce_discount_percent as number) ?? null,
			(d.ecommerce_deposit_percent as number) ?? globalDepositPct
		),
		billingType: (d.ecommerce_billing_type as string) || null,
		kind: 'main'
	};

	const addonRefs = (d.ecommerce_addons as Array<{ addon_page?: { uid?: string } }>) ?? [];
	const addons = await Promise.all(
		addonRefs.map(async (ref): Promise<CheckoutLine | null> => {
			const addonUid = ref.addon_page?.uid;
			if (!addonUid) return null;
			try {
				const addonDoc = await client.getByUID('page', addonUid, lang ? { lang } : {});
				const ad = addonDoc.data as Record<string, unknown>;
				return {
					label: titleOf(ad, addonUid),
					price: calcDisplayPrice(
						(ad.ecommerce_price_chf as number) ?? null,
						(ad.ecommerce_discount_percent as number) ?? null,
						(ad.ecommerce_deposit_percent as number) ?? globalDepositPct
					),
					billingType: (ad.ecommerce_billing_type as string) || null,
					kind: 'addon'
				};
			} catch {
				return null;
			}
		})
	);

	return [main, ...addons.filter((a): a is CheckoutLine => a !== null)];
}

async function resolveLeistung(
	client: Client,
	uid: string,
	lang: string | undefined
): Promise<CheckoutLine[]> {
	const doc = await client.getByUID('leistung', uid, lang ? { lang } : {});
	const d = doc.data as Record<string, unknown>;
	const price = (d.price_chf as number) ?? null;
	if (price === null) return [];
	return [{ label: (d.label as string) || uid, price, billingType: 'Einmalig', kind: 'main' }];
}

/** Lines in cart order; items that no longer exist or have no price are skipped */
export async function resolveCartLines(
	client: Client,
	refs: CartItemRef[],
	lang: string | undefined,
	globalDepositPct: number | null
): Promise<CheckoutLine[]> {
	const resolved = await Promise.all(
		refs.map((ref) =>
			(ref.type === 'page'
				? resolvePage(client, ref.uid, lang, globalDepositPct)
				: resolveLeistung(client, ref.uid, lang)
			).catch(() => [] as CheckoutLine[])
		)
	);
	return resolved.flat();
}

/** "Chat-Bot, Deine Website Basis" — used as order label in e-mails, customer list and confirmation */
export function cartLabel(lines: CheckoutLine[]): string {
	return lines
		.filter((l) => l.kind === 'main')
		.map((l) => l.label)
		.join(', ');
}
