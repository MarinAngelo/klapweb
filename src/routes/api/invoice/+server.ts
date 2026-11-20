import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';
import { calcDisplayPrice } from '$lib/pricing';
import { fetchExchangeRates } from '$lib/utils/exchangeRates.server';
import { env } from '$env/dynamic/private';
import { saveCustomer, listCustomers } from '$lib/server/customers';
import { updateManualInvoice } from '$lib/server/invoices';
import {
	createInvoice,
	invoiceAttachment,
	invoiceSettingsFrom,
	type InvoiceItem,
	type InvoiceSettings
} from '$lib/server/invoicing';
import { saveEventRegistration } from '$lib/server/eventRegistrations';
import { parseCartSpec } from '$lib/utils/cartSpec';
import { resolveCartLines, cartLabel } from '$lib/server/cartLines';
import { getMailFrom } from '$lib/server/mailFrom';

interface InvoiceRequest {
	data: Record<string, string>;
	labels: Record<string, string>;
	serviceKey: string;
	selectedCurrency?: string;
	discountCode?: string;
	isEventCheckout?: boolean;
	eventPrice?: number | null;
	eventLabel?: string;
	eventManagerEmail?: string | null;
	/** Cart checkout: "leistung:<uid>,page:<uid>" — prices are resolved here */
	cart?: string;
	lang?: string;
}

interface EmailTemplate {
	subject: string | null;
	body: Array<{ text?: string }> | null;
}

interface CompanyInfo extends InvoiceSettings {
	globalDepositPct: number | null;
	discountCodes: Array<{ code: string; discount_percent: number | null }>;
	emailTemplates: {
		rechnung: EmailTemplate;
		bar: EmailTemplate;
	};
}

/** Replaces {{TOKEN}} placeholders in a plain string. */
function applyTokens(str: string, tokens: Record<string, string>): string {
	return str.replace(/\{\{([^{}]+)\}\}/g, (match, k) => tokens[k.trim()] ?? match);
}

/** Converts Prismic StructuredText blocks to a plain-text string with token replacement. */
function richTextToEmail(
	blocks: Array<{ text?: string }> | null | undefined,
	tokens: Record<string, string>
): string {
	if (!blocks?.length) return '';
	return blocks
		.filter((b) => b.text)
		.map((b) => applyTokens(b.text!, tokens))
		.join('\n\n');
}

async function fetchCompanyInfo(fetch: typeof globalThis.fetch): Promise<CompanyInfo> {
	let d: Record<string, unknown> = {};
	try {
		const settings = await createClient({ fetch }).getSingle('settings');
		d = settings.data as Record<string, unknown>;
	} catch {
		// Without settings: empty issuer, defaults
	}
	const template = (subject: unknown, body: unknown): EmailTemplate => ({
		subject: (subject as string) || null,
		body: Array.isArray(body) ? (body as Array<{ text?: string }>) : null
	});
	return {
		// Issuer, bank, VAT, QR bill: shared invoice module
		...invoiceSettingsFrom(d),
		globalDepositPct: (d.global_deposit_percent as number) ?? null,
		discountCodes: Array.isArray(d.discount_codes)
			? (d.discount_codes as Array<{ code?: string; discount_percent?: number }>)
					.filter((c) => c.code?.trim())
					.map((c) => ({ code: c.code!.trim(), discount_percent: c.discount_percent ?? null }))
			: [],
		emailTemplates: {
			rechnung: template(d.payment_rechnung_email_subject, d.payment_rechnung_email_body),
			bar: template(d.payment_bar_email_subject, d.payment_bar_email_body)
		}
	};
}

interface AddonInfo {
	label: string;
	price: number | null;
	billingType: string | null;
}

async function fetchProductInfo(
	fetch: typeof globalThis.fetch,
	serviceUid: string,
	globalDepositPct: number | null
): Promise<{
	label: string;
	price: number | null;
	billingType: string | null;
	addons: AddonInfo[];
}> {
	if (!serviceUid) return { label: serviceUid, price: null, billingType: null, addons: [] };
	try {
		const client = createClient({ fetch });
		const pageDoc = await client.getByUID('page', serviceUid);
		const d = pageDoc.data as Record<string, unknown>;
		const titleText = (pageDoc.data.title as Array<{ text: string }> | undefined)?.[0]?.text;
		const basePrice = (d.ecommerce_price_chf as number) ?? null;
		const discountPct = (d.ecommerce_discount_percent as number) ?? null;
		const depositPct = (d.ecommerce_deposit_percent as number) ?? globalDepositPct;
		const billingType = (d.ecommerce_billing_type as string) || null;

		// Resolve addon pages
		const addonRefs =
			(d.ecommerce_addons as Array<{ addon_page?: { uid?: string } }> | undefined) ?? [];
		const addons: AddonInfo[] = (
			await Promise.all(
				addonRefs.map(async (ref) => {
					const uid = ref.addon_page?.uid;
					if (!uid) return null;
					try {
						const addonDoc = await client.getByUID('page', uid);
						const ad = addonDoc.data as Record<string, unknown>;
						const addonBase = (ad.ecommerce_price_chf as number) ?? null;
						const addonDiscount = (ad.ecommerce_discount_percent as number) ?? null;
						const addonDeposit = (ad.ecommerce_deposit_percent as number) ?? globalDepositPct;
						return {
							label: (addonDoc.data.title as Array<{ text: string }>)?.[0]?.text ?? uid,
							price: calcDisplayPrice(addonBase, addonDiscount, addonDeposit),
							billingType: (ad.ecommerce_billing_type as string) || null
						} satisfies AddonInfo;
					} catch {
						return null;
					}
				})
			)
		).filter((a): a is AddonInfo => a !== null);

		return {
			label: titleText ?? serviceUid,
			price: calcDisplayPrice(basePrice, discountPct, depositPct),
			billingType,
			addons
		};
	} catch {
		return { label: serviceUid, price: null, billingType: null, addons: [] };
	}
}

/** One invoice position; discount codes apply to `discountable` positions only */
interface PdfLine {
	label: string;
	price: number | null;
	billingType: string | null;
	discountable: boolean;
}

const BILLING_TYPE_SUFFIX: Record<string, string> = {
	Einmalig: 'Einmalig',
	Jährlich: 'pro Jahr',
	Monatlich: 'pro Monat'
};

/** "Chat-Bot (Einmalig)", "Hosting (pro Jahr)" */
function lineLabel(line: { label: string; billingType: string | null }): string {
	const suffix = line.billingType ? BILLING_TYPE_SUFFIX[line.billingType] : undefined;
	return suffix ? `${line.label} (${suffix})` : line.label;
}

/** Discount of one position (same rounding as before: whole cents) */
function lineDiscount(line: PdfLine, codeDiscount: { pct: number } | null): number {
	if (!codeDiscount || !line.discountable || line.price === null) return 0;
	return Math.round(line.price * codeDiscount.pct) / 100;
}

export const POST: RequestHandler = async ({ request, fetch }) => {
	let body: InvoiceRequest;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Ungültige Anfrage' }), { status: 400 });
	}

	const {
		data,
		labels,
		serviceKey,
		selectedCurrency,
		discountCode,
		isEventCheckout,
		eventPrice,
		eventLabel,
		eventManagerEmail,
		cart,
		lang
	} = body;
	const invoiceNumber = `INV-${Date.now()}`;

	// Firmendaten + Produktdaten laden
	const co = await fetchCompanyInfo(fetch);
	const cartRefs = isEventCheckout ? [] : parseCartSpec(cart);
	const isCart = cartRefs.length > 0;

	// Positions in the base currency: cart lines, or main product followed by its add-ons
	let baseLines: PdfLine[];
	let orderLabel: string;
	if (isCart) {
		const cartLines = await resolveCartLines(
			createClient({ fetch }),
			cartRefs,
			lang,
			co.globalDepositPct
		);
		if (cartLines.length === 0) {
			return new Response(JSON.stringify({ error: 'Der Warenkorb ist leer' }), { status: 400 });
		}
		baseLines = cartLines.map((line) => ({
			label: line.label,
			price: line.price,
			billingType: line.billingType,
			discountable: line.kind === 'main'
		}));
		orderLabel = cartLabel(cartLines);
	} else {
		const product = isEventCheckout
			? {
					label: eventLabel || serviceKey,
					price: eventPrice ?? null,
					billingType: 'Einmalig' as const,
					addons: [] as AddonInfo[]
				}
			: await fetchProductInfo(fetch, serviceKey, co.globalDepositPct);
		baseLines = [
			{
				label: product.label,
				price: product.price,
				billingType: product.billingType,
				discountable: true
			},
			...product.addons.map((addon) => ({ ...addon, discountable: false }))
		];
		orderLabel = product.label;
	}

	// Währungskonvertierung (falls Käufer andere Währung gewählt hat)
	const invoiceCurrency = selectedCurrency?.trim() || co.currency;
	let conversionRate: number | null = null;
	if (invoiceCurrency !== co.currency) {
		const rates = await fetchExchangeRates(co.currency, [invoiceCurrency]);
		conversionRate = rates[invoiceCurrency] ?? null;
	}
	const lines: PdfLine[] = baseLines.map((line) => ({
		...line,
		price:
			line.price !== null && conversionRate !== null
				? Math.round(line.price * conversionRate * 100) / 100
				: line.price
	}));
	const invoicePrice = lines[0]?.price ?? null;

	// Rabatt-Code validieren
	let codeDiscountInfo: { code: string; pct: number } | null = null;
	if (discountCode?.trim() && lines.some((line) => line.discountable && line.price !== null)) {
		const match = co.discountCodes.find(
			(c) => c.code.toLowerCase() === discountCode.trim().toLowerCase()
		);
		if (match?.discount_percent) {
			codeDiscountInfo = { code: discountCode.trim(), pct: match.discount_percent };
		}
	}
	// Amount for e-mail tokens / customer list: single product = main price after discount
	// (unchanged), cart = total of all positions after discount
	const finalPrice = isCart
		? Math.round(
				lines.reduce(
					(sum, line) => sum + (line.price ?? 0) - lineDiscount(line, codeDiscountInfo),
					0
				) * 100
			) / 100
		: codeDiscountInfo && invoicePrice !== null
			? Math.round(invoicePrice * (1 - codeDiscountInfo.pct / 100) * 100) / 100
			: invoicePrice;

	// Invoice positions: discount line right after the last discounted position
	const totalDiscount = lines.reduce((sum, line) => sum + lineDiscount(line, codeDiscountInfo), 0);
	const lastDiscountable = lines.reduce(
		(last, line, i) => (line.discountable && line.price !== null ? i : last),
		-1
	);
	const items: InvoiceItem[] = [];
	lines.forEach((line, i) => {
		items.push({
			description: lineLabel(line),
			quantity: 1,
			unitPrice: line.price ?? 0,
			billingType: line.billingType
		});
		if (codeDiscountInfo && i === lastDiscountable) {
			items.push({
				description: `Rabatt ${codeDiscountInfo.code} (-${codeDiscountInfo.pct}%)`,
				quantity: 1,
				unitPrice: -totalDiscount,
				billingType: line.billingType
			});
		}
	});

	// PDF (incl. QR bill) + storage via the shared invoice module
	let pdfBytes: Uint8Array;
	let invoiceId: string | null = null;
	try {
		const created = await createInvoice({
			source: isEventCheckout ? 'event' : 'checkout',
			relatedId: serviceKey || undefined,
			invoiceNumber,
			recipient: {
				vorname: data['vorname'],
				nachname: data['nachname'],
				firma: data['firma'],
				email: data['email'],
				tel: data['tel'],
				adresse: data['adresse'],
				plz: data['plz'],
				ort: data['ort'],
				land: data['land'],
				extraLines: data['projektname'] ? [`Projektname: ${data['projektname']}`] : []
			},
			items,
			currency: invoiceCurrency,
			settings: co
		});
		pdfBytes = created.pdf;
		invoiceId = created.id;
	} catch (e) {
		console.error('PDF-Generierung fehlgeschlagen:', e);
		return new Response(JSON.stringify({ error: 'PDF konnte nicht erstellt werden' }), {
			status: 500
		});
	}

	// Kundendaten speichern (mit Duplikat-Prüfung)
	(async () => {
		try {
			const email = data['email']?.trim().toLowerCase();
			const existingCustomers = await listCustomers();

			// Prüfe E-Mail (primär)
			if (email) {
				const existingCustomer = existingCustomers.find(
					(c) => c.email && c.email.toLowerCase() === email
				);
				if (existingCustomer) {
					console.log(`Kunde mit E-Mail ${email} existiert bereits.`);
					return;
				}
			}

			// Falls keine E-Mail, prüfe Name
			if (!email) {
				const vorname = data['vorname']?.trim().toLowerCase();
				const nachname = data['nachname']?.trim().toLowerCase();
				if (vorname && nachname) {
					const existingCustomer = existingCustomers.find(
						(c) => c.vorname?.toLowerCase() === vorname && c.nachname?.toLowerCase() === nachname
					);
					if (existingCustomer) {
						console.log(`Kunde ${vorname} ${nachname} existiert bereits.`);
						return;
					}
				}
			}

			await saveCustomer({
				date: new Date().toISOString(),
				paymentMethod: 'rechnung',
				service: orderLabel,
				amount: finalPrice,
				currency: invoiceCurrency,
				discountCode: codeDiscountInfo?.code,
				vorname: data['vorname'],
				nachname: data['nachname'],
				firma: data['firma'],
				email: data['email'],
				adresse: data['adresse'],
				plz: data['plz'],
				ort: data['ort'],
				land: data['land']
			});
		} catch (e) {
			console.error('Kunde konnte nicht gespeichert werden:', e);
		}
	})();

	// Production: E-Mail via Resend
	const resendKey = env.RESEND_API_KEY;
	const fromEmail = await getMailFrom();
	const businessEmail = isEventCheckout && eventManagerEmail ? eventManagerEmail : co.email;

	if (!resendKey || !fromEmail) {
		console.error('Resend-Konfiguration fehlt (RESEND_API_KEY / Absender-E-Mail (Einstellungen))');
		return new Response(JSON.stringify({ error: 'E-Mail-Konfiguration fehlt' }), { status: 500 });
	}

	const customerEmail = data['email'] ?? '';
	const customerName =
		[data['vorname'], data['nachname']].filter(Boolean).join(' ') || data['name'] || 'Kunde';
	const attachment = invoiceAttachment(invoiceNumber, pdfBytes);

	// Token map for email templates
	const emailFmt = (n: number) =>
		new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: invoiceCurrency,
			currencyDisplay: 'code',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(n);
	const tokens: Record<string, string> = {
		Rechnungsnummer: invoiceNumber,
		Kundenname: customerName,
		Vorname: data['vorname'] ?? '',
		Nachname: data['nachname'] ?? '',
		Email: customerEmail,
		Dienstleistung: orderLabel,
		Betrag: finalPrice !== null ? emailFmt(finalPrice) : '—',
		Waehrung: invoiceCurrency,
		Firma: co.name,
		Zahlungsfrist: String(co.paymentTermsDays)
	};

	const custSubject = co.emailTemplates.rechnung.subject
		? applyTokens(co.emailTemplates.rechnung.subject, tokens)
		: `Ihre Rechnung ${invoiceNumber}${co.name ? ` – ${co.name}` : ''}`;
	const custText =
		richTextToEmail(co.emailTemplates.rechnung.body, tokens) ||
		`Sehr geehrte/r ${customerName}\n\nVielen Dank für Ihre Bestellung. Bitte finden Sie Ihre Rechnung im Anhang.\n\nFreundliche Grüsse\n${co.name}`;

	try {
		const { Resend } = await import('resend');
		const resend = new Resend(resendKey);
		// Sender incl. name from the settings («Absender-Name»)
		const fromWithName = fromEmail;

		// E-Mail an Kunden
		if (customerEmail) {
			const { error: custErr } = await resend.emails.send({
				from: fromWithName,
				to: customerEmail,
				subject: custSubject,
				text: custText,
				attachments: [attachment]
			});
			if (custErr) console.error('Kunden-E-Mail fehlgeschlagen:', custErr);
		}

		// Benachrichtigung an Geschäft (optional, wenn in CMS gesetzt)
		if (businessEmail) {
			const { error: bizErr } = await resend.emails.send({
				from: fromWithName,
				to: businessEmail,
				subject: `Neue Bestellung gegen Rechnung: ${invoiceNumber}`,
				text: `Neue Bestellung eingegangen.\n\nRechnungsnummer: ${invoiceNumber}\nKunde: ${customerName} <${customerEmail}>\nDienstleistung: ${isCart ? orderLabel : serviceKey}\n\nAlle Angaben:\n${Object.entries(
					data
				)
					.filter(([k]) => !['form-name', 'bot-field', 'subject'].includes(k))
					.map(([k, v]) => `${labels[k] ?? k}: ${v}`)
					.join('\n')}`,
				attachments: [attachment]
			});
			if (bizErr) console.error('Geschäfts-E-Mail fehlgeschlagen:', bizErr);
		}
	} catch (e) {
		console.error('E-Mail-Versand fehlgeschlagen:', e);
		return new Response(JSON.stringify({ error: 'E-Mail konnte nicht gesendet werden' }), {
			status: 500
		});
	}

	// Aktualisiere Status zu 'gesendet' und setze emailSentAt
	if (invoiceId) {
		try {
			await updateManualInvoice(invoiceId, {
				status: 'gesendet',
				emailSentAt: new Date().toISOString()
			});
		} catch (e) {
			console.error('Rechnung-Status konnte nicht aktualisiert werden:', e);
		}
	}

	if (isEventCheckout) {
		try {
			await saveEventRegistration({
				eventUid: serviceKey,
				eventLabel: eventLabel || serviceKey,
				date: new Date().toISOString(),
				vorname: data['vorname'] ?? '',
				nachname: data['nachname'] ?? '',
				email: data['email'] ?? null,
				firma: data['firma'] ?? null,
				paymentMethod: 'rechnung',
				amount: eventPrice ?? null,
				currency: invoiceCurrency,
				invoiceNumber
			});
		} catch (e) {
			console.error('Event-Registrierung konnte nicht gespeichert werden:', e);
		}
	}

	return new Response(JSON.stringify({ invoiceNumber }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
