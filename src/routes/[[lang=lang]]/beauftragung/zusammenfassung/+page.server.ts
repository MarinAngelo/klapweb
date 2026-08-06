import { createClient } from '$lib/prismicio';
import { calcDisplayPrice, parseCurrencyCode } from '$lib/pricing';
import { fetchExchangeRates } from '$lib/utils/exchangeRates.server';

export const prerender = false;

export interface AddonData {
	label: string;
	displayAmount: number | null;
	billingType: string | null;
}

export interface ProductData {
	label: string;
	price: number | null;
	displayAmount: number | null;
	stripeUrl: string | null;
	billingType: string | null;
	addons: AddonData[];
}

export async function load({ fetch, url, parent }) {
	const { lang, settings } = await parent();
	const pageTitle: string = (settings.data as any).zusammenfassung_title?.trim() || '';
	const checkoutButtonText: string = (settings.data as any).checkout_button_text?.trim() || '';
	const baseCurrency: string =
		parseCurrencyCode((settings.data as any).invoice_currency as string) || 'CHF';
	const additionalEntries: Array<{ waehrung?: string }> =
		(settings.data as any).invoice_additional_currencies ?? [];
	const additionalCodes = additionalEntries
		.map((e) => parseCurrencyCode(e.waehrung))
		.filter(Boolean);
	const rates = await fetchExchangeRates(baseCurrency, additionalCodes);

	// Payment methods — default to true if not explicitly set to false
	const paymentMethods = {
		stripe: (settings.data as any).payment_stripe_enabled !== false,
		rechnung: (settings.data as any).payment_rechnung_enabled !== false,
		bar: (settings.data as any).payment_bar_enabled !== false
	};

	const globalDepositPct: number | null = (settings.data as any).global_deposit_percent ?? null;

	const serviceUid = url.searchParams.get('service') ?? '';
	const isEventCheckout = url.searchParams.get('event_checkout') === 'true';
	if (!serviceUid)
		return {
			product: null,
			pageTitle,
			checkoutButtonText,
			baseCurrency,
			additionalCodes,
			rates,
			paymentMethods,
			barDescription: null,
			eventTexts: null
		};
	try {
		const client = createClient({ fetch });

		if (isEventCheckout) {
			const eventDoc = await client.getByUID('event', serviceUid, { lang });
			const d = eventDoc.data as Record<string, unknown>;
			const basePrice = (d.ticket_price_chf as number) ?? null;
			const displayAmount = calcDisplayPrice(basePrice, null, null);
			const eventPaymentMethods = {
				stripe: false,
				rechnung: (d.payment_rechnung_enabled as boolean) !== false,
				bar: (d.payment_bar_enabled as boolean) !== false
			};
			const eventTexts = {
				summaryTitle: (d.checkout_summary_title as string)?.trim() || null,
				orderLabel: (d.checkout_order_label as string)?.trim() || null,
				priceLabel: (d.checkout_price_label as string)?.trim() || null,
				checkoutButtonText: (d.checkout_button_text as string)?.trim() || null,
				rechnungLabel: (d.payment_rechnung_label as string)?.trim() || null,
				rechnungDescription: (d.payment_rechnung_description as string)?.trim() || null,
				barLabel: (d.payment_bar_label as string)?.trim() || null,
				barDescription: (d.payment_bar_description as string)?.trim() || null
			};
			const priceRange = (d.ticket_price_chf_range as number) ?? null;
			const additionalCostChf = (d.additional_costs_chf as number) ?? null;
			const additionalCostLabel = (d.additional_costs_label as string)?.trim() || null;
			const eventManagerEmail = (d.event_manager_email as string)?.trim() || null;
			return {
				product: {
					label: (d.title as string) || serviceUid,
					price: basePrice,
					displayAmount,
					stripeUrl: null,
					billingType: 'Einmalig',
					addons: []
				} satisfies ProductData,
				pageTitle: eventTexts.summaryTitle || pageTitle,
				checkoutButtonText: eventTexts.checkoutButtonText || checkoutButtonText,
				baseCurrency,
				additionalCodes,
				rates,
				paymentMethods: eventPaymentMethods,
				eventTexts,
				isEventCheckout: true,
				eventUid: serviceUid,
				priceRange,
				additionalCostChf,
				additionalCostLabel,
				eventManagerEmail
			};
		}

		const pageDoc = await client.getByUID('page', serviceUid, { lang });
		const d = pageDoc.data as Record<string, unknown>;
		const stripeLink = d.ecommerce_stripe_url as { url?: string } | null | undefined;
		const basePrice = (d.ecommerce_price_chf as number) ?? null;
		const discountPct = (d.ecommerce_discount_percent as number) ?? null;
		const depositPct = (d.ecommerce_deposit_percent as number) ?? globalDepositPct;
		const displayAmount = calcDisplayPrice(basePrice, discountPct, depositPct);
		const billingType = (d.ecommerce_billing_type as string) || null;

		// Resolve addon pages
		const addonRefs =
			(d.ecommerce_addons as Array<{ addon_page?: { uid?: string } }> | undefined) ?? [];
		const addons: AddonData[] = (
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
						} satisfies AddonData;
					} catch {
						return null;
					}
				})
			)
		).filter((a): a is AddonData => a !== null);

		return {
			product: {
				label: pageDoc.data.title
					? ((pageDoc.data.title as Array<{ text: string }>)[0]?.text ?? serviceUid)
					: serviceUid,
				price: basePrice,
				displayAmount,
				stripeUrl: stripeLink?.url ?? null,
				billingType,
				addons
			} satisfies ProductData,
			pageTitle,
			checkoutButtonText,
			baseCurrency,
			additionalCodes,
			rates,
			paymentMethods,
			barDescription: null,
			eventTexts: null,
			isEventCheckout: false,
			eventUid: ''
		};
	} catch (e) {
		console.error('[zusammenfassung] Fehler beim Laden von UID:', serviceUid, e);
		return {
			product: null,
			pageTitle,
			checkoutButtonText,
			baseCurrency,
			additionalCodes,
			rates,
			paymentMethods,
			barDescription: null,
			eventTexts: null,
			isEventCheckout: false,
			eventUid: ''
		};
	}
}
