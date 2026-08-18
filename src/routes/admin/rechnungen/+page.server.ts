import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { env } from '$env/dynamic/private';
import {
	listManualInvoices,
	saveManualInvoice,
	deleteManualInvoice,
	getManualInvoice,
	updateManualInvoice
} from '$lib/server/invoices';
import { listCustomers } from '$lib/server/customers';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '$lib/prismicio';

const ADMIN_SECRET = env.ADMIN_SECRET;

export const load: PageServerLoad = async ({ url, fetch }) => {
	const secret = url.searchParams.get('secret');
	if (!secret || secret !== ADMIN_SECRET) {
		throw error(403, 'Zugang verweigert');
	}

	const [invoices, customers] = await Promise.all([listManualInvoices(), listCustomers()]);

	// Firmendaten laden
	const client = createClient({ fetch });
	const settings = await client.getSingle('settings');
	const d = settings.data as Record<string, unknown>;

	const companyInfo = {
		name: (d.responsible_person_company as string) ?? '',
		address:
			(Array.isArray(d.responsible_address)
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
		currency: (d.invoice_currency as string)?.split(' - ')?.[0] ?? 'CHF'
	};

	return { invoices, customers, companyInfo };
};

export const actions: Actions = {
	preview: async ({ request, fetch }) => {
		const formData = await request.formData();
		const secret = formData.get('secret') as string;
		if (!secret || secret !== ADMIN_SECRET) {
			throw error(403, 'Zugang verweigert');
		}
		const itemsJson = formData.get('items-json') as string;
		const items = JSON.parse(itemsJson);

		const invoiceData = {
			vorname: formData.get('vorname') as string,
			nachname: formData.get('nachname') as string,
			firma: (formData.get('firma') as string) || undefined,
			email: (formData.get('email') as string) || undefined,
			adresse: (formData.get('adresse') as string) || undefined,
			plz: (formData.get('plz') as string) || undefined,
			ort: (formData.get('ort') as string) || undefined,
			land: (formData.get('land') as string) || undefined,
			items
		};

		// Firmendaten laden
		const client = createClient({ fetch });
		const settings = await client.getSingle('settings');
		const d = settings.data as Record<string, unknown>;

		const companyInfo = {
			name: (d.responsible_person_company as string) ?? '',
			address:
				(Array.isArray(d.responsible_address)
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
			currency: (d.invoice_currency as string)?.split(' - ')?.[0] ?? 'CHF'
		};

		const invoiceNumber = `MAN-${Date.now()}`;
		const pdfBytes = await generateManualPdf(invoiceNumber, invoiceData, companyInfo);

		return {
			success: true,
			pdfBase64: Buffer.from(pdfBytes).toString('base64'),
			invoiceNumber,
			itemsJson
		};
	},

	save: async ({ request, fetch }) => {
		const formData = await request.formData();
		const secret = formData.get('secret') as string;
		if (!secret || secret !== ADMIN_SECRET) {
			throw error(403, 'Zugang verweigert');
		}
		const itemsJson = formData.get('items-json') as string;
		const items = JSON.parse(itemsJson);
		const invoiceNumber = formData.get('invoice-number') as string;
		const sendEmail = formData.get('send-email') === 'true';

		const invoiceData = {
			vorname: formData.get('vorname') as string,
			nachname: formData.get('nachname') as string,
			firma: (formData.get('firma') as string) || undefined,
			email: (formData.get('email') as string) || undefined,
			adresse: (formData.get('adresse') as string) || undefined,
			plz: (formData.get('plz') as string) || undefined,
			ort: (formData.get('ort') as string) || undefined,
			land: (formData.get('land') as string) || undefined,
			items,
			notes: (formData.get('notes') as string) || undefined
		};

		const client = createClient({ fetch });
		const settings = await client.getSingle('settings');
		const d = settings.data as Record<string, unknown>;

		const companyInfo = {
			name: (d.responsible_person_company as string) ?? '',
			address:
				(Array.isArray(d.responsible_address)
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
			currency: (d.invoice_currency as string)?.split(' - ')?.[0] ?? 'CHF'
		};

		const pdfBytes = await generateManualPdf(invoiceNumber, invoiceData, companyInfo);

		let initialStatus: 'gespeichert' | 'gesendet' = 'gespeichert';
		let emailSentAt: string | undefined;

		// E-Mail versenden wenn gewünscht
		if (sendEmail && invoiceData.email) {
			const { env: privEnv } = await import('$env/dynamic/private');
			const resendKey = privEnv.RESEND_API_KEY;
			const fromEmail = privEnv.INVOICE_FROM_EMAIL;

			if (resendKey && fromEmail) {
				try {
					const { Resend } = await import('resend');
					const resend = new Resend(resendKey);
					const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

					const { error } = await resend.emails.send({
						from: fromEmail,
						to: invoiceData.email,
						subject: `Ihre Rechnung ${invoiceNumber} – ${companyInfo.name}`,
						text: `Sehr geehrte/r ${invoiceData.vorname} ${invoiceData.nachname},\n\nVielen Dank für Ihren Auftrag. Bitte finden Sie Ihre Rechnung im Anhang.\n\nFreundliche Grüsse\n${companyInfo.name}`,
						attachments: [{ filename: `Rechnung_${invoiceNumber}.pdf`, content: pdfBase64 }]
					});

					if (!error) {
						initialStatus = 'gesendet';
						emailSentAt = new Date().toISOString();
					}
				} catch (e) {
					console.error('E-Mail-Versand fehlgeschlagen:', e);
				}
			}
		}

		const invoiceId = await saveManualInvoice({
			invoiceNumber,
			date: new Date().toISOString(),
			status: initialStatus,
			vorname: invoiceData.vorname,
			nachname: invoiceData.nachname,
			firma: invoiceData.firma,
			email: invoiceData.email,
			adresse: invoiceData.adresse,
			plz: invoiceData.plz,
			ort: invoiceData.ort,
			land: invoiceData.land,
			items,
			notes: invoiceData.notes,
			currency: companyInfo.currency,
			emailSentAt
		});

		const savedInvoice = await getManualInvoice(invoiceId);
		return { success: true, invoiceNumber, invoice: savedInvoice };
	},

	delete: async ({ request, fetch }) => {
		const formData = await request.formData();
		const secret = formData.get('secret') as string;
		if (!secret || secret !== ADMIN_SECRET) {
			throw error(403, 'Zugang verweigert');
		}

		const invoiceId = formData.get('invoice-id') as string;
		if (!invoiceId) {
			throw error(400, 'Rechnung-ID fehlt');
		}

		try {
			await deleteManualInvoice(invoiceId);
			return { success: true };
		} catch (e) {
			console.error('Rechnung löschen fehlgeschlagen:', e);
			throw error(500, 'Rechnung konnte nicht gelöscht werden');
		}
	},

	deleteAll: async ({ request }) => {
		const formData = await request.formData();
		const secret = formData.get('secret') as string;
		if (!secret || secret !== ADMIN_SECRET) {
			throw error(403, 'Zugang verweigert');
		}
		const all = await listManualInvoices();
		await Promise.all(all.map((inv) => deleteManualInvoice(inv.id)));
		return { success: true };
	},

	edit: async ({ request, fetch }) => {
		const formData = await request.formData();
		const secret = formData.get('secret') as string;
		if (!secret || secret !== ADMIN_SECRET) {
			throw error(403, 'Zugang verweigert');
		}

		const invoiceId = formData.get('invoice-id') as string;
		if (!invoiceId) {
			throw error(400, 'Rechnung-ID fehlt');
		}

		const invoice = await getManualInvoice(invoiceId);
		if (!invoice) {
			throw error(404, 'Rechnung nicht gefunden');
		}

		return { invoice };
	},

	updateInvoice: async ({ request, fetch }) => {
		const formData = await request.formData();
		const secret = formData.get('secret') as string;
		if (!secret || secret !== ADMIN_SECRET) {
			throw error(403, 'Zugang verweigert');
		}

		const invoiceId = formData.get('invoice-id') as string;
		const itemsJson = formData.get('items-json') as string;
		const items = JSON.parse(itemsJson);

		if (!invoiceId) {
			throw error(400, 'Rechnung-ID fehlt');
		}

		try {
			await updateManualInvoice(invoiceId, {
				vorname: formData.get('vorname') as string,
				nachname: formData.get('nachname') as string,
				firma: (formData.get('firma') as string) || undefined,
				email: (formData.get('email') as string) || undefined,
				adresse: (formData.get('adresse') as string) || undefined,
				plz: (formData.get('plz') as string) || undefined,
				ort: (formData.get('ort') as string) || undefined,
				land: (formData.get('land') as string) || undefined,
				items,
				notes: (formData.get('notes') as string) || undefined,
				paymentStatus: (formData.get('payment-status') as 'offen' | 'bezahlt') || 'offen'
			});

			return { success: true };
		} catch (e) {
			console.error('Rechnung aktualisieren fehlgeschlagen:', e);
			throw error(500, 'Rechnung konnte nicht aktualisiert werden');
		}
	},

	previewEditPdf: async ({ request, fetch }) => {
		const formData = await request.formData();
		const secret = formData.get('secret') as string;
		if (!secret || secret !== ADMIN_SECRET) {
			throw error(403, 'Zugang verweigert');
		}

		const itemsJson = formData.get('items-json') as string;
		const items = JSON.parse(itemsJson);
		const invoiceNumber = formData.get('invoice-number') as string;

		const invoiceData = {
			vorname: formData.get('vorname') as string,
			nachname: formData.get('nachname') as string,
			firma: (formData.get('firma') as string) || undefined,
			email: (formData.get('email') as string) || undefined,
			adresse: (formData.get('adresse') as string) || undefined,
			plz: (formData.get('plz') as string) || undefined,
			ort: (formData.get('ort') as string) || undefined,
			land: (formData.get('land') as string) || undefined,
			items,
			notes: (formData.get('notes') as string) || undefined
		};

		const client = createClient({ fetch });
		const settings = await client.getSingle('settings');
		const d = settings.data as Record<string, unknown>;

		const companyInfo = {
			name: (d.responsible_person_company as string) ?? '',
			address:
				(Array.isArray(d.responsible_address)
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
			currency: (d.invoice_currency as string)?.split(' - ')?.[0] ?? 'CHF'
		};

		const pdfBytes = await generateManualPdf(invoiceNumber, invoiceData, companyInfo);
		return {
			pdfBase64: Buffer.from(pdfBytes).toString('base64')
		};
	},

	sendInvoiceEmail: async ({ request, fetch }) => {
		const formData = await request.formData();
		const secret = formData.get('secret') as string;
		if (!secret || secret !== ADMIN_SECRET) {
			throw error(403, 'Zugang verweigert');
		}

		const invoiceId = formData.get('invoice-id') as string;
		if (!invoiceId) {
			throw error(400, 'Rechnung-ID fehlt');
		}

		const invoice = await getManualInvoice(invoiceId);
		if (!invoice) {
			throw error(404, 'Rechnung nicht gefunden');
		}

		if (!invoice.email) {
			throw error(400, 'Keine E-Mail-Adresse vorhanden');
		}

		// Generiere PDF
		const client = createClient({ fetch });
		const settings = await client.getSingle('settings');
		const d = settings.data as Record<string, unknown>;

		const companyInfo = {
			name: (d.responsible_person_company as string) ?? '',
			address:
				(Array.isArray(d.responsible_address)
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
			currency: invoice.currency || 'CHF'
		};

		const pdfBytes = await generateManualPdf(invoice.invoiceNumber, invoice as any, companyInfo);
		const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

		// Versende E-Mail
		const resendKey = env.RESEND_API_KEY;
		const fromEmail = env.INVOICE_FROM_EMAIL;

		if (!resendKey || !fromEmail) {
			throw error(500, 'E-Mail-Konfiguration fehlt');
		}

		try {
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);

			const customerName = [invoice.vorname, invoice.nachname].filter(Boolean).join(' ');

			await resend.emails.send({
				from: fromEmail,
				to: invoice.email,
				subject: `Ihre Rechnung ${invoice.invoiceNumber} – ${companyInfo.name}`,
				text: `Sehr geehrte/r ${customerName},\n\nVielen Dank für Ihren Auftrag. Bitte finden Sie Ihre Rechnung im Anhang.\n\nFreundliche Grüsse\n${companyInfo.name}`,
				attachments: [{ filename: `Rechnung_${invoice.invoiceNumber}.pdf`, content: pdfBase64 }]
			});

			// Update Status
			await updateManualInvoice(invoiceId, {
				status: 'gesendet',
				emailSentAt: new Date().toISOString()
			});

			return { success: true };
		} catch (e) {
			console.error('E-Mail-Versand fehlgeschlagen:', e);
			throw error(500, 'E-Mail konnte nicht versendet werden');
		}
	}
};

async function generateManualPdf(
	invoiceNumber: string,
	data: {
		vorname: string;
		nachname: string;
		firma?: string;
		email?: string;
		adresse?: string;
		plz?: string;
		ort?: string;
		land?: string;
		items: Array<{ description: string; quantity: number; unitPrice: number }>;
		notes?: string;
	},
	companyInfo: {
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
	page.drawText(companyInfo.name || 'Unbekannte Firma', {
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
	for (const line of (companyInfo.address || '').split('\n').filter(Boolean)) {
		page.drawText(line, { x: marginL, y, size: 10, font: fontRegular, color: gray });
		y -= 14;
	}
	if (companyInfo.uid) {
		page.drawText(`UID: ${companyInfo.uid}`, {
			x: marginL,
			y,
			size: 9,
			font: fontRegular,
			color: gray
		});
		y -= 14;
	}
	if (companyInfo.email) {
		page.drawText(companyInfo.email, { x: marginL, y, size: 9, font: fontRegular, color: gray });
	}

	y -= 40;

	// --- Trennlinie ---
	page.drawLine({
		start: { x: marginL, y },
		end: { x: marginR, y },
		thickness: 0.5,
		color: lightGray
	});
	y -= 30;

	// --- Rechnungstitel + Nummer ---
	page.drawText('RECHNUNG', { x: marginL, y, size: 20, font: fontBold, color: black });
	y -= 22;
	page.drawText(`Nr. ${invoiceNumber}`, {
		x: marginL,
		y,
		size: 11,
		font: fontRegular,
		color: gray
	});

	y -= 40;

	// --- Empfänger ---
	page.drawText('Rechnungsempfänger', { x: marginL, y, size: 9, font: fontBold, color: gray });
	y -= 16;

	const recipientLines: Array<{ text: string }> = [];
	const fullName = [data.vorname, data.nachname].filter(Boolean).join(' ');
	if (fullName) recipientLines.push({ text: fullName });
	if (data.firma) recipientLines.push({ text: data.firma });
	if (data.adresse) recipientLines.push({ text: data.adresse });
	const plzOrt = [data.plz, data.ort].filter(Boolean).join(' ');
	if (plzOrt) recipientLines.push({ text: plzOrt });
	if (data.land) recipientLines.push({ text: data.land });
	recipientLines.push({ text: '' });
	if (data.email) recipientLines.push({ text: `E-Mail: ${data.email}` });

	for (const line of recipientLines) {
		if (line.text === '') {
			y -= 8;
			continue;
		}
		page.drawText(line.text, { x: marginL, y, size: 10, font: fontRegular, color: black });
		y -= 16;
	}

	y -= 30;

	// --- Leistungsübersicht ---
	page.drawRectangle({
		x: marginL,
		y: y - 4,
		width: marginR - marginL,
		height: 22,
		color: lightGray
	});
	page.drawText('Leistung', { x: marginL + 8, y: y + 4, size: 10, font: fontBold, color: black });

	const menge = 'Menge';
	const mengeWidth = fontBold.widthOfTextAtSize(menge, 10);
	page.drawText(menge, {
		x: marginR - mengeWidth - 120,
		y: y + 4,
		size: 10,
		font: fontBold,
		color: black
	});

	const betrag = `Betrag ${companyInfo.currency}`;
	const betragWidth = fontBold.widthOfTextAtSize(betrag, 10);
	page.drawText(betrag, {
		x: marginR - betragWidth - 8,
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

	const fmt = (n: number) =>
		new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: companyInfo.currency,
			currencyDisplay: 'code',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(n);

	// --- Line items ---
	let subtotal = 0;
	for (const item of data.items) {
		page.drawText(item.description, {
			x: marginL + 8,
			y,
			size: 10,
			font: fontRegular,
			color: black
		});

		const qtyStr = item.quantity.toString();
		const qtyWidth = fontRegular.widthOfTextAtSize(qtyStr, 10);
		page.drawText(qtyStr, {
			x: marginR - qtyWidth - 120,
			y,
			size: 10,
			font: fontRegular,
			color: black
		});

		const itemTotal = item.quantity * item.unitPrice;
		subtotal += itemTotal;
		drawRight(fmt(itemTotal), y);
		y -= 20;
	}

	y -= 10;
	page.drawLine({
		start: { x: marginL, y },
		end: { x: marginR, y },
		thickness: 0.5,
		color: lightGray
	});
	y -= 16;

	// --- Totals ---
	let grandTotal = subtotal;
	let vatAmount = 0;

	if (companyInfo.vatRate) {
		vatAmount = Math.round(subtotal * companyInfo.vatRate) / 100;
		grandTotal = subtotal + vatAmount;

		page.drawText('Zwischensumme', {
			x: marginL + 8,
			y,
			size: 10,
			font: fontRegular,
			color: black
		});
		drawRight(fmt(subtotal), y);
		y -= 20;

		page.drawText(`MwSt ${companyInfo.vatRate}%`, {
			x: marginL + 8,
			y,
			size: 10,
			font: fontRegular,
			color: black
		});
		drawRight(fmt(vatAmount), y);
		y -= 20;

		page.drawText('Total inkl. MwSt.', {
			x: marginL + 8,
			y,
			size: 10,
			font: fontBold,
			color: black
		});
		drawRight(fmt(grandTotal), y, fontBold);
	} else {
		page.drawText('Total exkl. MwSt.', {
			x: marginL + 8,
			y,
			size: 10,
			font: fontBold,
			color: black
		});
		drawRight(fmt(subtotal), y, fontBold);
	}

	y -= 50;

	// --- Zahlungsbedingungen ---
	page.drawText(`Zahlungsbedingungen: ${companyInfo.paymentTermsDays} Tage netto`, {
		x: marginL,
		y,
		size: 10,
		font: fontRegular,
		color: black
	});
	y -= 18;

	if (companyInfo.iban) {
		page.drawText(
			`Bitte zahlen Sie innerhalb von ${companyInfo.paymentTermsDays} Tagen auf folgendes Konto:`,
			{ x: marginL, y, size: 10, font: fontRegular, color: black }
		);
		y -= 18;
		page.drawText(
			`IBAN: ${companyInfo.iban}${companyInfo.bank ? `  |  Bank: ${companyInfo.bank}` : ''}${companyInfo.bic ? `  |  BIC: ${companyInfo.bic}` : ''}`,
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

	// --- Notizen (falls vorhanden) ---
	if (data.notes) {
		y -= 50;
		page.drawText('Notizen', {
			x: marginL,
			y,
			size: 10,
			font: fontBold,
			color: black
		});
		y -= 16;

		// Einfache Zeilenumbruch-Logik
		const lines = data.notes.split('\n');
		for (const line of lines) {
			page.drawText(line, { x: marginL, y, size: 9, font: fontRegular, color: gray });
			y -= 14;
		}
	}

	return pdfDoc.save();
}
