import type { RequestHandler } from '@sveltejs/kit';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '$lib/prismicio';
import { calcDisplayPrice, parseCurrencyCode } from '$lib/pricing';
import { fetchExchangeRates } from '$lib/utils/exchangeRates.server';
import { env } from '$env/dynamic/private';

interface InvoiceRequest {
	data: Record<string, string>;
	labels: Record<string, string>;
	serviceKey: string;
	selectedCurrency?: string;
	discountCode?: string;
}

interface EmailTemplate {
	subject: string | null;
	body: Array<{ text?: string }> | null;
}

interface CompanyInfo {
	name: string;
	address: string;
	email: string;
	uid: string;
	iban: string;
	bank: string;
	bic: string;
	paymentTermsDays: number;
	vatRate: number | null;
	currency: string;
	globalDepositPct: number | null;
	discountCodes: Array<{ code: string; discount_percent: number | null }>;
	emailTemplates: {
		rechnung: EmailTemplate;
		bar: EmailTemplate;
	};
}

/** Replaces {{TOKEN}} placeholders in a plain string. */
function applyTokens(str: string, tokens: Record<string, string>): string {
	return str.replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? `{{${k}}}`);
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
	try {
		const client = createClient({ fetch });
		const settings = await client.getSingle('settings');
		const d = settings.data as Record<string, unknown>;

		return {
			name: (d.responsible_person_company as string) ?? '',
			address: (Array.isArray(d.responsible_address)
				? (d.responsible_address as Array<{ text?: string }>)
						.map((b) => b?.text ?? '')
						.filter(Boolean)
						.join('\n')
				: '') ?? '',
			email: (d.responsible_email as string) ?? (d.e_mail as string) ?? '',
			uid: (d.company_identification_number as string) ?? '',
			iban: (d.invoice_iban as string) ?? '',
			bank: (d.invoice_bank as string) ?? '',
			bic: (d.invoice_bic as string) ?? '',
			paymentTermsDays: (d.invoice_payment_terms_days as number) ?? 30,
			vatRate: (d.invoice_vat_rate as number) ?? null,
			currency: parseCurrencyCode(d.invoice_currency as string) || 'CHF',
			globalDepositPct: (d.global_deposit_percent as number) ?? null,
			discountCodes: Array.isArray(d.discount_codes)
				? (d.discount_codes as Array<{ code?: string; discount_percent?: number }>)
						.filter((c) => c.code?.trim())
						.map((c) => ({ code: c.code!.trim(), discount_percent: c.discount_percent ?? null }))
				: [],
			emailTemplates: {
				rechnung: {
					subject: (d.payment_rechnung_email_subject as string) || null,
					body: Array.isArray(d.payment_rechnung_email_body)
						? (d.payment_rechnung_email_body as Array<{ text?: string }>)
						: null
				},
				bar: {
					subject: (d.payment_bar_email_subject as string) || null,
					body: Array.isArray(d.payment_bar_email_body)
						? (d.payment_bar_email_body as Array<{ text?: string }>)
						: null
				}
			}
		};
	} catch {
		const noTemplate: EmailTemplate = { subject: null, body: null };
		return {
			name: '',
			address: '',
			email: '',
			uid: '',
			iban: '',
			bank: '',
			bic: '',
			paymentTermsDays: 30,
			vatRate: null,
			currency: 'CHF',
			globalDepositPct: null,
			discountCodes: [],
			emailTemplates: { rechnung: noTemplate, bar: noTemplate }
		};
	}
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
): Promise<{ label: string; price: number | null; billingType: string | null; addons: AddonInfo[] }> {
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

async function generatePdf(
	invoiceNumber: string,
	data: Record<string, string>,
	serviceLabel: string,
	netPrice: number | null,
	co: CompanyInfo,
	codeDiscount: { code: string; pct: number } | null,
	addons: Array<{ label: string; price: number | null; billingType: string | null }>,
	mainBillingType: string | null
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([595, 842]); // A4
	const { width, height } = page.getSize();

	const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
	const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

	const black = rgb(0, 0, 0);
	const gray = rgb(0.45, 0.45, 0.45);
	const lightGray = rgb(0.85, 0.85, 0.85);

	const marginL = 60;
	const marginR = width - 60;
	let y = height - 60;

	// --- Firmenname ---
	page.drawText(co.name || 'Unbekannte Firma', {
		x: marginL,
		y,
		size: 18,
		font: fontBold,
		color: black
	});

	// --- Datum (oben rechts) ---
	const dateStr = new Intl.DateTimeFormat('de-CH', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(new Date());
	const dateWidth = fontRegular.widthOfTextAtSize(dateStr, 10);
	page.drawText(dateStr, { x: marginR - dateWidth, y, size: 10, font: fontRegular, color: gray });

	y -= 20;
	// Adresse (mehrzeilig)
	for (const line of (co.address || '').split('\n').filter(Boolean)) {
		page.drawText(line, { x: marginL, y, size: 10, font: fontRegular, color: gray });
		y -= 14;
	}
	if (co.uid) {
		page.drawText(`UID: ${co.uid}`, { x: marginL, y, size: 9, font: fontRegular, color: gray });
		y -= 14;
	}
	if (co.email) {
		page.drawText(co.email, { x: marginL, y, size: 9, font: fontRegular, color: gray });
	}

	y -= 40;

	// --- Trennlinie ---
	page.drawLine({ start: { x: marginL, y }, end: { x: marginR, y }, thickness: 0.5, color: lightGray });
	y -= 30;

	// --- Rechnungstitel + Nummer ---
	page.drawText('RECHNUNG', { x: marginL, y, size: 20, font: fontBold, color: black });
	y -= 22;
	page.drawText(`Nr. ${invoiceNumber}`, { x: marginL, y, size: 11, font: fontRegular, color: gray });

	y -= 40;

	// --- Empfänger ---
	page.drawText('Rechnungsempfänger', { x: marginL, y, size: 9, font: fontBold, color: gray });
	y -= 16;

	const d = data;
	const recipientLines: Array<{ text: string; bold?: boolean }> = [];

	// Name / Firma
	const fullName = [d['vorname'], d['nachname']].filter(Boolean).join(' ');
	if (fullName) recipientLines.push({ text: fullName });
	if (d['firma']) recipientLines.push({ text: d['firma'] });

	// Adresse
	if (d['adresse']) recipientLines.push({ text: d['adresse'] });
	const plzOrt = [d['plz'], d['ort']].filter(Boolean).join(' ');
	if (plzOrt) recipientLines.push({ text: plzOrt });
	if (d['land']) recipientLines.push({ text: d['land'] });

	// Leerzeile + E-Mail + Projektname
	recipientLines.push({ text: '' });
	if (d['email']) recipientLines.push({ text: `E-Mail: ${d['email']}` });
	if (d['projektname']) recipientLines.push({ text: `Projektname: ${d['projektname']}` });

	for (const line of recipientLines) {
		if (line.text === '') { y -= 8; continue; }
		page.drawText(line.text, { x: marginL, y, size: 10, font: fontRegular, color: black });
		y -= 16;
	}

	y -= 30;

	// --- Leistungsübersicht ---
	// Header-Zeile
	page.drawRectangle({
		x: marginL,
		y: y - 4,
		width: marginR - marginL,
		height: 22,
		color: lightGray
	});
	page.drawText('Leistung', { x: marginL + 8, y: y + 4, size: 10, font: fontBold, color: black });
	const totalLabel = `Betrag ${co.currency}`;
	const totalLabelWidth = fontBold.widthOfTextAtSize(totalLabel, 10);
	page.drawText(totalLabel, {
		x: marginR - totalLabelWidth - 8,
		y: y + 4,
		size: 10,
		font: fontBold,
		color: black
	});
	y -= 28;

	const drawRight = (text: string, yPos: number, font = fontRegular) => {
		const w = font.widthOfTextAtSize(text, 10);
		page.drawText(text, { x: marginR - w - 8, y: yPos, size: 10, font, color: black });
	};

	// pdf-lib StandardFonts only support WinAnsi (Latin-1). Currency symbols like ₹ (INR)
	// are not in WinAnsi, so use currency code display (e.g. "INR 1'234.00") instead of symbol.
	const fmt = (n: number) =>
		new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: co.currency,
			currencyDisplay: 'code',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(n);
	// Apply code discount to main service
	const codeDiscountAmount =
		codeDiscount && netPrice !== null ? Math.round(netPrice * codeDiscount.pct) / 100 : 0;
	const discountedPrice = netPrice !== null ? netPrice - codeDiscountAmount : null;

	const billingTypeSuffix: Record<string, string> = { Jährlich: 'pro Jahr', Monatlich: 'pro Monat' };

	// --- Line items ---
	// Main service
	page.drawText(serviceLabel, { x: marginL + 8, y, size: 10, font: fontRegular, color: black });
	drawRight(netPrice !== null ? fmt(netPrice) : '—', y);
	y -= 20;

	// Code discount
	if (codeDiscount && netPrice !== null) {
		page.drawText(`Rabatt ${codeDiscount.code} (-${codeDiscount.pct}%)`, {
			x: marginL + 8, y, size: 10, font: fontRegular, color: gray
		});
		drawRight(fmt(-codeDiscountAmount), y);
		y -= 20;
	}

	// Addon lines
	for (const addon of addons) {
		const addonSuffix = addon.billingType && billingTypeSuffix[addon.billingType]
			? ` (${billingTypeSuffix[addon.billingType]})`
			: '';
		page.drawText(`${addon.label}${addonSuffix}`, {
			x: marginL + 8, y, size: 10, font: fontRegular, color: black
		});
		drawRight(addon.price !== null ? fmt(addon.price) : '—', y);
		y -= 20;
	}

	y -= 10;
	page.drawLine({ start: { x: marginL, y }, end: { x: marginR, y }, thickness: 0.5, color: lightGray });
	y -= 16;

	// --- Totals ---
	if (co.vatRate && discountedPrice !== null) {
		// VAT: apply to sum of all items
		const allItemsNet = [discountedPrice, ...addons.map((a) => a.price ?? 0)].reduce(
			(s, p) => s + p, 0
		);
		const vatAmount = Math.round(allItemsNet * co.vatRate) / 100;
		const grandTotal = allItemsNet + vatAmount;

		if (addons.length > 0) {
			page.drawText('Zwischensumme', { x: marginL + 8, y, size: 10, font: fontRegular, color: black });
			drawRight(fmt(allItemsNet), y);
			y -= 20;
		}
		page.drawText(`MwSt ${co.vatRate}%`, { x: marginL + 8, y, size: 10, font: fontRegular, color: black });
		drawRight(fmt(vatAmount), y);
		y -= 20;
		page.drawText('Total inkl. MwSt.', { x: marginL + 8, y, size: 10, font: fontBold, color: black });
		drawRight(fmt(grandTotal), y, fontBold);
	} else if (addons.length > 0) {
		// No VAT, multiple items: grouped totals by billing type
		const byType: Record<string, number> = {};
		if (discountedPrice !== null) {
			const t = mainBillingType ?? 'Einmalig';
			byType[t] = (byType[t] ?? 0) + discountedPrice;
		}
		for (const addon of addons) {
			if (addon.price === null) continue;
			const t = addon.billingType ?? 'Einmalig';
			byType[t] = (byType[t] ?? 0) + addon.price;
		}
		for (const [type, total] of Object.entries(byType)) {
			page.drawText(`Total ${type} exkl. MwSt.`, {
				x: marginL + 8, y, size: 10, font: fontBold, color: black
			});
			drawRight(fmt(total), y, fontBold);
			y -= 18;
		}
	} else {
		// No VAT, single item
		const priceStr = discountedPrice !== null ? fmt(discountedPrice) : '—';
		page.drawText('Total exkl. MwSt.', { x: marginL + 8, y, size: 10, font: fontBold, color: black });
		drawRight(priceStr, y, fontBold);
	}

	y -= 50;

	// --- Zahlungsbedingungen ---
	page.drawText(`Zahlungsbedingungen: ${co.paymentTermsDays} Tage netto`, {
		x: marginL,
		y,
		size: 10,
		font: fontRegular,
		color: black
	});
	y -= 18;
	if (co.iban) {
		page.drawText(
			`Bitte zahlen Sie innerhalb von ${co.paymentTermsDays} Tagen auf folgendes Konto:`,
			{ x: marginL, y, size: 10, font: fontRegular, color: black }
		);
		y -= 18;
		page.drawText(
			`IBAN: ${co.iban}${co.bank ? `  |  Bank: ${co.bank}` : ''}${co.bic ? `  |  BIC: ${co.bic}` : ''}`,
			{ x: marginL, y, size: 10, font: fontRegular, color: black }
		);
		y -= 16;
	}
	page.drawText(`Zahlungsreferenz: ${invoiceNumber}`, {
		x: marginL,
		y,
		size: 10,
		font: fontBold,
		color: black
	});

	return pdfDoc.save();
}

export const POST: RequestHandler = async ({ request, fetch }) => {
	let body: InvoiceRequest;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Ungültige Anfrage' }), { status: 400 });
	}

	const { data, labels, serviceKey, selectedCurrency, discountCode } = body;
	const invoiceNumber = `INV-${Date.now()}`;

	// Firmendaten + Produktdaten laden
	const co = await fetchCompanyInfo(fetch);
	const product = await fetchProductInfo(fetch, serviceKey, co.globalDepositPct);

	// Währungskonvertierung (falls Käufer andere Währung gewählt hat)
	const invoiceCurrency = selectedCurrency?.trim() || co.currency;
	let invoicePrice = product.price;
	let conversionRate: number | null = null;
	if (invoiceCurrency !== co.currency) {
		const rates = await fetchExchangeRates(co.currency, [invoiceCurrency]);
		conversionRate = rates[invoiceCurrency] ?? null;
		if (invoicePrice !== null && conversionRate !== null) {
			invoicePrice = Math.round(invoicePrice * conversionRate * 100) / 100;
		}
	}

	// Convert addon prices to invoiceCurrency
	const convertedAddons = product.addons.map((addon) => ({
		...addon,
		price:
			addon.price !== null && conversionRate !== null
				? Math.round(addon.price * conversionRate * 100) / 100
				: addon.price
	}));

	// Rabatt-Code validieren
	let codeDiscountInfo: { code: string; pct: number } | null = null;
	if (discountCode?.trim() && invoicePrice !== null) {
		const match = co.discountCodes.find(
			(c) => c.code.toLowerCase() === discountCode.trim().toLowerCase()
		);
		if (match?.discount_percent) {
			codeDiscountInfo = { code: discountCode.trim(), pct: match.discount_percent };
		}
	}
	// Final price (after code discount) — used for email tokens
	const finalPrice =
		codeDiscountInfo && invoicePrice !== null
			? Math.round(invoicePrice * (1 - codeDiscountInfo.pct / 100) * 100) / 100
			: invoicePrice;

	// Build service label with billing type suffix for PDF
	const billingTypeSuffix: Record<string, string> = { Jährlich: 'pro Jahr', Monatlich: 'pro Monat' };
	const pdfServiceLabel = product.billingType && billingTypeSuffix[product.billingType]
		? `${product.label} (${billingTypeSuffix[product.billingType]})`
		: product.label;

	// PDF generieren (generatePdf receives price before code discount; applies discount internally)
	let pdfBytes: Uint8Array;
	try {
		pdfBytes = await generatePdf(invoiceNumber, data, pdfServiceLabel, invoicePrice, {
			...co,
			currency: invoiceCurrency
		}, codeDiscountInfo, convertedAddons, product.billingType);
	} catch (e) {
		console.error('PDF-Generierung fehlgeschlagen:', e);
		return new Response(JSON.stringify({ error: 'PDF konnte nicht erstellt werden' }), {
			status: 500
		});
	}

	// Dev-Modus: E-Mail überspringen
	if (import.meta.env.DEV) {
		console.log(
			`[DEV] Rechnung ${invoiceNumber} generiert (${pdfBytes.length} Bytes). E-Mail nicht gesendet.`
		);
		return new Response(JSON.stringify({ invoiceNumber }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Production: E-Mail via Resend
	const resendKey = env.RESEND_API_KEY;
	const fromEmail = env.INVOICE_FROM_EMAIL;
	const toEmail = env.INVOICE_TO_EMAIL;

	if (!resendKey || !fromEmail || !toEmail) {
		console.error('Resend-Konfiguration fehlt (RESEND_API_KEY / INVOICE_FROM_EMAIL / INVOICE_TO_EMAIL)');
		return new Response(JSON.stringify({ error: 'E-Mail-Konfiguration fehlt' }), { status: 500 });
	}

	const customerEmail = data['email'] ?? '';
	const customerName = [data['vorname'], data['nachname']].filter(Boolean).join(' ') || data['name'] || 'Kunde';
	const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

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
		Dienstleistung: product.label,
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

		// E-Mail an Kunden
		if (customerEmail) {
			const { error: custErr } = await resend.emails.send({
				from: fromEmail,
				to: customerEmail,
				subject: custSubject,
				text: custText,
				attachments: [{ filename: `Rechnung_${invoiceNumber}.pdf`, content: pdfBase64 }]
			});
			if (custErr) console.error('Kunden-E-Mail fehlgeschlagen:', custErr);
		}

		// Benachrichtigung an Geschäft
		const { error: bizErr } = await resend.emails.send({
			from: fromEmail,
			to: toEmail,
			subject: `Neue Bestellung gegen Rechnung: ${invoiceNumber}`,
			text: `Neue Bestellung eingegangen.\n\nRechnungsnummer: ${invoiceNumber}\nKunde: ${customerName} <${customerEmail}>\nDienstleistung: ${serviceKey}\n\nAlle Angaben:\n${Object.entries(data)
				.filter(([k]) => !['form-name', 'bot-field', 'subject'].includes(k))
				.map(([k, v]) => `${labels[k] ?? k}: ${v}`)
				.join('\n')}`,
			attachments: [{ filename: `Rechnung_${invoiceNumber}.pdf`, content: pdfBase64 }]
		});
		if (bizErr) {
			console.error('Geschäfts-E-Mail fehlgeschlagen:', bizErr);
			return new Response(JSON.stringify({ error: 'E-Mail konnte nicht gesendet werden' }), {
				status: 500
			});
		}
	} catch (e) {
		console.error('E-Mail-Versand fehlgeschlagen:', e);
		return new Response(JSON.stringify({ error: 'E-Mail konnte nicht gesendet werden' }), {
			status: 500
		});
	}

	return new Response(JSON.stringify({ invoiceNumber }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
