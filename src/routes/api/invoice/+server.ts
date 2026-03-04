import type { RequestHandler } from '@sveltejs/kit';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '$lib/prismicio';
import { calcDisplayPrice, formatPrice, parseCurrencyCode } from '$lib/pricing';
import { fetchExchangeRates } from '$lib/utils/exchangeRates.server';
import { env } from '$env/dynamic/private';

interface InvoiceRequest {
	data: Record<string, string>;
	labels: Record<string, string>;
	serviceKey: string;
	selectedCurrency?: string;
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
			currency: parseCurrencyCode(d.invoice_currency as string) || 'CHF'
		};
	} catch {
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
			currency: 'CHF'
		};
	}
}

async function fetchProductInfo(
	fetch: typeof globalThis.fetch,
	serviceUid: string
): Promise<{ label: string; price: number | null }> {
	if (!serviceUid) return { label: serviceUid, price: null };
	try {
		const client = createClient({ fetch });
		const pageDoc = await client.getByUID('page', serviceUid);
		const d = pageDoc.data as Record<string, unknown>;
		const titleText = (pageDoc.data.title as Array<{ text: string }> | undefined)?.[0]?.text;
		const basePrice = (d.ecommerce_price_chf as number) ?? null;
		const discountPct = (d.ecommerce_discount_percent as number) ?? null;
		const depositPct = (d.ecommerce_deposit_percent as number) ?? null;
		return {
			label: titleText ?? serviceUid,
			price: calcDisplayPrice(basePrice, discountPct, depositPct)
		};
	} catch {
		return { label: serviceUid, price: null };
	}
}

async function generatePdf(
	invoiceNumber: string,
	data: Record<string, string>,
	serviceLabel: string,
	netPrice: number | null,
	co: CompanyInfo
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

	const fmt = (n: number) => formatPrice(n, co.currency);
	const priceStr = netPrice !== null ? fmt(netPrice) : '—';

	if (co.vatRate && netPrice !== null) {
		// Mit MWST: 3 Zeilen
		const vatAmount = Math.round(netPrice * co.vatRate) / 100;
		const total = netPrice + vatAmount;

		page.drawText(serviceLabel, { x: marginL + 8, y, size: 10, font: fontRegular, color: black });
		drawRight(fmt(netPrice), y);
		y -= 20;

		page.drawText(`MwSt ${co.vatRate}%`, { x: marginL + 8, y, size: 10, font: fontRegular, color: black });
		drawRight(fmt(vatAmount), y);
		y -= 30;

		page.drawLine({ start: { x: marginL, y }, end: { x: marginR, y }, thickness: 0.5, color: lightGray });
		y -= 16;

		page.drawText('Total inkl. MwSt.', { x: marginL + 8, y, size: 10, font: fontBold, color: black });
		drawRight(fmt(total), y, fontBold);
	} else {
		// Ohne MWST (oder Preis unbekannt)
		page.drawText(serviceLabel, { x: marginL + 8, y, size: 10, font: fontRegular, color: black });
		drawRight(priceStr, y);
		y -= 30;

		page.drawLine({ start: { x: marginL, y }, end: { x: marginR, y }, thickness: 0.5, color: lightGray });
		y -= 16;

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

	const { data, labels, serviceKey, selectedCurrency } = body;
	const invoiceNumber = `INV-${Date.now()}`;

	// Firmendaten + Produktdaten parallel laden
	const [co, product] = await Promise.all([
		fetchCompanyInfo(fetch),
		fetchProductInfo(fetch, serviceKey)
	]);

	// Währungskonvertierung (falls Käufer andere Währung gewählt hat)
	const invoiceCurrency = selectedCurrency?.trim() || co.currency;
	let invoicePrice = product.price;
	if (invoicePrice !== null && invoiceCurrency !== co.currency) {
		const rates = await fetchExchangeRates(co.currency, [invoiceCurrency]);
		const rate = rates[invoiceCurrency];
		if (rate != null) invoicePrice = Math.round(invoicePrice * rate * 100) / 100;
	}

	// PDF generieren
	let pdfBytes: Uint8Array;
	try {
		pdfBytes = await generatePdf(invoiceNumber, data, product.label, invoicePrice, {
			...co,
			currency: invoiceCurrency
		});
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
	const customerName = data['name'] ?? data['vorname'] ?? 'Kunde';
	const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

	try {
		const { Resend } = await import('resend');
		const resend = new Resend(resendKey);

		// E-Mail an Kunden
		if (customerEmail) {
			const { error: custErr } = await resend.emails.send({
				from: fromEmail,
				to: customerEmail,
				subject: `Ihre Rechnung ${invoiceNumber}${co.name ? ` – ${co.name}` : ''}`,
				text: `Sehr geehrte/r ${customerName}\n\nVielen Dank für Ihre Bestellung. Bitte finden Sie Ihre Rechnung im Anhang.\n\nFreundliche Grüsse\n${co.name}`,
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
