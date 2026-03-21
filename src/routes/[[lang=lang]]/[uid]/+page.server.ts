import { createClient } from '$lib/prismicio';
import { error, redirect, isRedirect } from '@sveltejs/kit';
import { asText, asHTML } from '@prismicio/client';
import { fetchExchangeRates } from '$lib/utils/exchangeRates.server';
import { parseCurrencyCode, calcDisplayPrice } from '$lib/pricing';

export interface AddonRow {
	label: string;
	displayAmount: number | null;
	billingType: string | null;
}

export async function load({ params, parent, fetch, cookies }) {
	const { lang, settings } = await parent();
	const client = createClient({ fetch });

	try {
		// 2. Dokument über UID und die ermittelte Sprache (de-de) suchen
		const page = await client.getByUID('page', params.uid, {
			lang,
			fetchLinks: [
				'page.title',
				'page.ecommerce_price_chf',
				'page.ecommerce_billing_type',
				'page.ecommerce_discount_percent',
				'page.ecommerce_deposit_percent',
				'leistung.label',
				'leistung.beschreibung'
			]
		});

		// Password protection
		if ((page.data as any).password_protected === true) {
			const pagePassword = (settings.data as any).page_password as string | null;
			const authCookie = cookies.get('klap_auth');
			if (!pagePassword || authCookie !== pagePassword) {
				const redirectPath = params.lang ? `/${params.lang}/${params.uid}` : `/${params.uid}`;
				throw redirect(303, `/login?redirect=${encodeURIComponent(redirectPath)}`);
			}
		}

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

		// Resolve plan leistungen for image_cards/plaene slices
		type PlaeneFeature = { label: string; wert: string | null; beschreibung?: string };
		const plaeneData: Record<string, Array<Array<PlaeneFeature>>> = {};
		const plaeneSlices = ((page.data as any).slices ?? []).filter(
			(s: any) => s.slice_type === 'image_cards' && s.variation === 'plaene'
		);
		await Promise.all(
			plaeneSlices.map(async (s: any) => {
				const planDocs = await Promise.all(
					(s.items as Array<{ plan: any }>).map(async (item) => {
						const uid = item.plan?.uid;
						if (!uid) return [];
						try {
							const planPage = await client.getByUID('page', uid, { lang });
							const leistungen: Array<{ leistung?: any; wert?: string }> =
								(planPage.data as any).leistungen ?? [];
							return await Promise.all(
								leistungen.map(async (row) => {
									const lUid = row.leistung?.uid;
									let beschreibung: string | undefined;
									let label = row.leistung?.uid ?? '';
									if (lUid) {
										try {
											const doc = await client.getByUID('leistung', lUid, { lang });
											label = (doc.data as any).label ?? label;
											const blocks = (doc.data as any).beschreibung ?? [];
											beschreibung = blocks.length ? (asHTML(blocks) ?? undefined) : undefined;
										} catch { /* ignore */ }
									}
									return { label, wert: row.wert ?? null, beschreibung } as PlaeneFeature;
								})
							);
						} catch {
							return [] as PlaeneFeature[];
						}
					})
				);
				plaeneData[s.id] = planDocs;
			})
		);

		// Resolve page's own leistungen with full beschreibung (fetchLinks only returns first block)
		const leistungenRefs: Array<{ leistung?: any; wert?: string }> =
			(page.data as any).leistungen ?? [];
		const pageLeistungen = await Promise.all(
			leistungenRefs.map(async (row) => {
				const uid = row.leistung?.uid;
				if (!uid) return null;
				try {
					const doc = await client.getByUID('leistung', uid, { lang });
					return { leistung: doc, wert: row.wert ?? null };
				} catch {
					return null;
				}
			})
		).then((rows) => rows.filter(Boolean));

		// Resolve addon pages for ecommerce products
		const globalDepositPct: number | null = (settings.data as any).global_deposit_percent ?? null;
		const addonRefs =
			((page.data as any).ecommerce_addons as Array<{ addon_page?: { uid?: string } }> | undefined) ?? [];
		const addonRows: AddonRow[] = (
			await Promise.all(
				addonRefs.map(async (ref) => {
					const uid = ref.addon_page?.uid;
					if (!uid) return null;
					try {
						const addonDoc = await client.getByUID('page', uid, { lang });
						const ad = addonDoc.data as Record<string, unknown>;
						const addonBase = (ad.ecommerce_price_chf as number) ?? null;
						const addonDiscount = (ad.ecommerce_discount_percent as number) ?? null;
						const addonDeposit = (ad.ecommerce_deposit_percent as number) ?? globalDepositPct;
						return {
							label: (addonDoc.data.title as Array<{ text: string }>)?.[0]?.text ?? uid,
							displayAmount: calcDisplayPrice(addonBase, addonDiscount, addonDeposit),
							billingType: (ad.ecommerce_billing_type as string) || null
						} satisfies AddonRow;
					} catch {
						return null;
					}
				})
			)
		).filter((a): a is AddonRow => a !== null);

		return {
			page,
			title: asText(page.data.title) || '',
			meta_title: page.data.meta_title || '',
			meta_description: page.data.meta_description,
			baseCurrency,
			additionalCodes,
			rates,
			addonRows,
			globalDepositPct,
			plaeneData,
			pageLeistungen
		};
	} catch (e: any) {
		if (isRedirect(e)) throw e;
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
