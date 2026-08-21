import { createClient } from '$lib/prismicio';
import { error, redirect, isRedirect } from '@sveltejs/kit';
import { asText, asHTML } from '@prismicio/client';
import { fetchExchangeRates } from '$lib/utils/exchangeRates.server';
import { parseCurrencyCode, calcDisplayPrice } from '$lib/pricing';
import { FEATURE_ECOMMERCE } from '$lib/server/features';

export interface AddonRow {
	label: string;
	displayAmount: number | null;
	billingType: string | null;
}

export interface PlaeneFeature {
	label: string;
	wert: string | null;
	beschreibung?: string;
	leistungUid?: string;
}

export async function load({ params, parent, fetch, cookies }) {
	const { lang, settings } = await parent();
	const client = createClient({ fetch });

	try {
		// 2. Dokument über UID und die ermittelte Sprache (de-de) suchen
		const page = await client.getByUID('page', params.uid, {
			lang,
			// fetchLinks nur laden wenn E-Commerce-Feature aktiv ist
			fetchLinks: FEATURE_ECOMMERCE
				? [
						'page.title',
						'page.ecommerce_price_chf',
						'page.ecommerce_billing_type',
						'page.ecommerce_discount_percent',
						'page.ecommerce_deposit_percent',
						'leistung.label',
						'leistung.beschreibung'
					]
				: []
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

		// Guard 1 (Plan-Level): E-Commerce-Feature im aktiven Plan nicht verfügbar
		if (!FEATURE_ECOMMERCE) {
			return {
				page,
				title: asText(page.data.title) || '',
				meta_title: page.data.meta_title || '',
				meta_description: page.data.meta_description,
				baseCurrency: 'CHF',
				additionalCodes: [] as string[],
				rates: {} as Record<string, number>,
				addonRows: [] as AddonRow[],
				globalDepositPct: null,
				plaeneData: {} as Record<string, Array<Array<PlaeneFeature>>>,
				pageLeistungen: [] as Array<{ leistung: any; wert: string | null }>
			};
		}

		// Guard 2 (Slice-Level): Seite hat keine E-Commerce-Slices oder -Felder
		const slices: any[] = (page.data as any).slices ?? [];
		const hasEcommerceSlices = slices.some(
			(s) => s.slice_type === 'image_cards' && s.variation === 'plaene'
		);
		const hasPrice = (page.data as any).ecommerce_price_chf != null;
		const hasLeistungen = ((page.data as any).leistungen ?? []).length > 0;
		const hasAddons = ((page.data as any).ecommerce_addons ?? []).length > 0;

		if (!hasEcommerceSlices && !hasPrice && !hasLeistungen && !hasAddons) {
			return {
				page,
				title: asText(page.data.title) || '',
				meta_title: page.data.meta_title || '',
				meta_description: page.data.meta_description,
				baseCurrency: 'CHF',
				additionalCodes: [] as string[],
				rates: {} as Record<string, number>,
				addonRows: [] as AddonRow[],
				globalDepositPct: null,
				plaeneData: {} as Record<string, Array<Array<PlaeneFeature>>>,
				pageLeistungen: [] as Array<{ leistung: any; wert: string | null }>
			};
		}

		// Currency config (only relevant for ecommerce pages)
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

		// Resolve plan leistungen + Seiten-Leistungen (optimiert: Batch-Fetch statt N+1)
		type PlaeneFeature = { label: string; wert: string | null; beschreibung?: string };
		const plaeneData: Record<string, Array<Array<PlaeneFeature>>> = {};
		const plaeneSlices = slices.filter(
			(s: any) => s.slice_type === 'image_cards' && s.variation === 'plaene'
		);
		const leistungenRefs: Array<{ leistung?: any; wert?: string }> =
			(page.data as any).leistungen ?? [];

		// Schritt 1: Alle Plan-Seiten + Leistungen parallel laden
		const planPagesPerSlice: Array<Array<any>> = await Promise.all(
			plaeneSlices.map((s: any) =>
				Promise.all(
					(s.items as Array<{ plan: any }>).map((item) => {
						const uid = item.plan?.uid;
						if (!uid) return Promise.resolve(null);
						// Versuche erst als Page, dann als Leistung
						return client
							.getByUID('page', uid, { lang })
							.catch(() => client.getByUID('leistung', uid, { lang }))
							.catch(() => null);
					})
				)
			)
		);

		// Schritt 2: Alle Leistungs-IDs sammeln (Pläne + direkte Seiten-Leistungen)
		const allLeistungIds: string[] = [];
		for (const planPages of planPagesPerSlice) {
			for (const planPage of planPages) {
				for (const row of ((planPage?.data as any)?.leistungen ?? []) as Array<{
					leistung?: any;
				}>) {
					if (row.leistung?.id) allLeistungIds.push(row.leistung.id);
				}
			}
		}
		for (const row of leistungenRefs) {
			if (row.leistung?.id) allLeistungIds.push(row.leistung.id);
		}

		// Schritt 3: Alle Leistungen in EINEM einzigen API-Call laden
		const uniqueLeistungIds = [...new Set(allLeistungIds)];
		const leistungDocs =
			uniqueLeistungIds.length > 0
				? await client.getAllByIDs(uniqueLeistungIds, { lang }).catch(() => [] as any[])
				: [];
		const leistungById = new Map<string, any>(leistungDocs.map((d: any) => [d.id, d]));

		// Schritt 4: plaeneData aus gecachten Dokumenten aufbauen (keine weiteren API-Calls)
		for (let i = 0; i < plaeneSlices.length; i++) {
			const s = plaeneSlices[i];
			plaeneData[s.id] = planPagesPerSlice[i].map((planPage: any) => {
				if (!planPage) return [] as PlaeneFeature[];
				return ((planPage.data as any).leistungen ?? []).map(
					(row: { leistung?: any; wert?: string }) => {
						const doc = row.leistung?.id ? leistungById.get(row.leistung.id) : null;
						const label = doc
							? ((doc.data as any).label ?? row.leistung?.uid ?? '')
							: (row.leistung?.uid ?? '');
						const blocks = doc ? ((doc.data as any).beschreibung ?? []) : [];
						const beschreibung: string | undefined = blocks.length
							? (asHTML(blocks) ?? undefined)
							: undefined;
						const leistungUid = doc?.uid ?? row.leistung?.uid ?? undefined;
						return { label, wert: row.wert ?? null, beschreibung, leistungUid } as PlaeneFeature;
					}
				);
			});
		}

		// Seiten-Leistungen aus gecachten Dokumenten zusammenstellen
		const pageLeistungen = leistungenRefs
			.map((row) => {
				const doc = row.leistung?.id ? leistungById.get(row.leistung.id) : null;
				if (!doc) return null;
				return { leistung: doc, wert: row.wert ?? null };
			})
			.filter(Boolean);

		// Resolve addon pages for ecommerce products
		const globalDepositPct: number | null = (settings.data as any).global_deposit_percent ?? null;
		const addonRefs =
			((page.data as any).ecommerce_addons as
				| Array<{ addon_page?: { uid?: string } }>
				| undefined) ?? [];
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
