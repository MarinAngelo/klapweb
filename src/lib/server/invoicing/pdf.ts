/**
 * Invoice PDF (A4) incl. Swiss QR payment part — the only invoice renderer of the project.
 * Layout of the payment part: Swiss Implementation Guidelines QR-bill (receipt 62 mm,
 * payment part 148 mm, height 105 mm at the bottom of the page).
 */
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import {
	countryCode,
	creditorReference,
	formatIban,
	formatReference,
	isQrIban,
	qrPayload,
	qrReference,
	type QrAddress
} from '$lib/qrBill.js';
import { qrBillIssues, type InvoiceSettings } from './settings';

export interface InvoiceItem {
	description: string;
	quantity: number;
	/** Negative = discount line */
	unitPrice: number;
	/** «Einmalig» / «Jährlich» / «Monatlich»: separate totals without VAT */
	billingType?: string | null;
}

export interface InvoiceRecipient {
	vorname?: string;
	nachname?: string;
	firma?: string;
	email?: string;
	tel?: string;
	adresse?: string;
	plz?: string;
	ort?: string;
	land?: string;
	/** Additional lines below the contact (e.g. «Projektname: …») */
	extraLines?: string[];
}

export interface InvoiceDocument {
	invoiceNumber: string;
	date?: string | Date;
	currency: string;
	recipient: InvoiceRecipient;
	items: InvoiceItem[];
	notes?: string;
	/** Column «Menge» (manual invoices) */
	showQuantity?: boolean;
}

const MM = 72 / 25.4;
const black = rgb(0, 0, 0);
const white = rgb(1, 1, 1);
const gray = rgb(0.45, 0.45, 0.45);
const lightGray = rgb(0.85, 0.85, 0.85);

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Total of the invoice incl. VAT — also the amount of the QR bill */
export function invoiceTotals(items: InvoiceItem[], vatRate: number | null) {
	const net = round2(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
	const vat = vatRate ? Math.round(net * vatRate) / 100 : 0;
	return { net, vat, total: round2(net + vat) };
}

/** Reference printed on the invoice and in the QR code (QR-IBAN → QR reference, else RF) */
export function paymentReference(invoiceNumber: string, iban: string): string {
	return isQrIban(iban) ? qrReference(invoiceNumber) : creditorReference(invoiceNumber);
}

/** Debtor address for the QR bill; null when incomplete (→ empty box «Zahlbar durch») */
function debtorAddress(r: InvoiceRecipient): QrAddress | null {
	const name = r.firma?.trim() || [r.vorname, r.nachname].filter(Boolean).join(' ').trim();
	const country = countryCode(r.land);
	if (!name || !r.plz?.trim() || !r.ort?.trim() || !country) return null;
	const street = /^(.*?\D)\s*(\d+\s?[a-zA-Z]?)$/.exec(r.adresse?.trim() ?? '');
	return {
		name,
		street: street ? street[1].trim() : (r.adresse?.trim() ?? ''),
		buildingNumber: street ? street[2].replace(/\s/g, '') : '',
		postalCode: r.plz.trim(),
		city: r.ort.trim(),
		country
	};
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
	const lines: string[] = [];
	for (const paragraph of text.split('\n')) {
		let line = '';
		for (const word of paragraph.split(' ')) {
			const candidate = line ? `${line} ${word}` : word;
			if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
				lines.push(line);
				line = word;
			} else line = candidate;
		}
		lines.push(line);
	}
	return lines;
}

/** pdf-lib standard fonts only know WinAnsi (Latin-1): replace other characters */
const winAnsi = (text: string) =>
	text
		.replace(/[‘’]/g, "'")
		.replace(/[“”„]/g, '"')
		.replace(/[–—]/g, '-')
		.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '?');

export async function renderInvoicePdf(
	invoice: InvoiceDocument,
	co: InvoiceSettings
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
	const pageSize: [number, number] = [595.28, 841.89];
	let page = pdfDoc.addPage(pageSize);
	const { width, height } = page.getSize();
	const marginL = 60;
	const marginR = width - 60;
	let y = height - 60;

	const text = (
		value: string,
		x: number,
		yPos: number,
		size = 10,
		f: PDFFont = font,
		color = black
	) => page.drawText(winAnsi(value), { x, y: yPos, size, font: f, color });
	const textRight = (value: string, yPos: number, f: PDFFont = font, size = 10) =>
		text(value, marginR - f.widthOfTextAtSize(winAnsi(value), size) - 8, yPos, size, f);
	const newPageIfBelow = (minY: number) => {
		if (y >= minY) return;
		page = pdfDoc.addPage(pageSize);
		y = height - 60;
	};

	const money = new Intl.NumberFormat('de-CH', {
		style: 'currency',
		currency: invoice.currency,
		currencyDisplay: 'code',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	// «CHF -8.00» instead of «CHF-8.00»
	const fmt = (n: number) =>
		n < 0 ? money.format(-n).replace(/^(\S+)\s/, '$1 -') : money.format(n);

	// --- Issuer + date ---
	text(co.name || 'Unbekannte Firma', marginL, y, 18, fontBold);
	const dateStr = new Intl.DateTimeFormat('de-CH', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(invoice.date ? new Date(invoice.date) : new Date());
	text(dateStr, marginR - font.widthOfTextAtSize(dateStr, 10), y, 10, font, gray);
	y -= 20;
	for (const line of co.address.split('\n').filter(Boolean)) {
		text(line, marginL, y, 10, font, gray);
		y -= 14;
	}
	if (co.uid) {
		text(`UID: ${co.uid}`, marginL, y, 9, font, gray);
		y -= 14;
	}
	if (co.email) text(co.email, marginL, y, 9, font, gray);
	y -= 28;
	page.drawLine({
		start: { x: marginL, y },
		end: { x: marginR, y },
		thickness: 0.5,
		color: lightGray
	});
	y -= 30;

	// --- Title ---
	text('RECHNUNG', marginL, y, 20, fontBold);
	y -= 22;
	text(`Nr. ${invoice.invoiceNumber}`, marginL, y, 11, font, gray);
	y -= 28;

	// --- Recipient ---
	const r = invoice.recipient;
	text('Rechnungsempfänger', marginL, y, 9, fontBold, gray);
	y -= 16;
	const recipientLines = [
		[r.vorname, r.nachname].filter(Boolean).join(' '),
		r.firma,
		r.adresse,
		[r.plz, r.ort].filter(Boolean).join(' '),
		r.land
	].filter((line): line is string => !!line);
	const contactLines = [
		r.email ? `E-Mail: ${r.email}` : '',
		r.tel ? `Tel.: ${r.tel}` : '',
		...(r.extraLines ?? [])
	].filter(Boolean);
	for (const line of recipientLines) {
		text(line, marginL, y);
		y -= 16;
	}
	if (contactLines.length) y -= 8;
	for (const line of contactLines) {
		text(line, marginL, y);
		y -= 16;
	}
	y -= 20;

	// --- Items ---
	const qtyX = marginR - 120;
	const descWidth = (invoice.showQuantity ? qtyX - 20 : marginR - 110) - (marginL + 8);
	const drawHeader = () => {
		page.drawRectangle({
			x: marginL,
			y: y - 4,
			width: marginR - marginL,
			height: 22,
			color: lightGray
		});
		text('Leistung', marginL + 8, y + 4, 10, fontBold);
		if (invoice.showQuantity)
			text('Menge', qtyX - fontBold.widthOfTextAtSize('Menge', 10), y + 4, 10, fontBold);
		textRight(`Betrag ${invoice.currency}`, y + 4, fontBold);
		y -= 28;
	};
	drawHeader();
	for (const item of invoice.items) {
		const lines = wrapText(winAnsi(item.description), font, 10, descWidth);
		newPageIfBelow(80 + lines.length * 14);
		if (y === height - 60) drawHeader();
		const color = item.unitPrice < 0 ? gray : black;
		lines.forEach((line, i) => text(line, marginL + 8, y - i * 14, 10, font, color));
		if (invoice.showQuantity) {
			const qty = String(item.quantity);
			text(qty, qtyX - font.widthOfTextAtSize(qty, 10), y);
		}
		textRight(fmt(item.quantity * item.unitPrice), y);
		y -= 6 + lines.length * 14;
	}
	y -= 10;
	newPageIfBelow(140);
	page.drawLine({
		start: { x: marginL, y },
		end: { x: marginR, y },
		thickness: 0.5,
		color: lightGray
	});
	y -= 16;

	// --- Totals ---
	const totals = invoiceTotals(invoice.items, co.vatRate);
	const totalLine = (label: string, amount: number, bold = false) => {
		text(label, marginL + 8, y, 10, bold ? fontBold : font);
		textRight(fmt(amount), y, bold ? fontBold : font);
		y -= 20;
	};
	if (co.vatRate) {
		if (invoice.items.length > 1) totalLine('Zwischensumme', totals.net);
		totalLine(`MwSt ${co.vatRate}%`, totals.vat);
		totalLine('Total inkl. MwSt.', totals.total, true);
	} else {
		// Without VAT: separate totals per billing type (one-off / yearly / monthly)
		const byType = new Map<string, number>();
		for (const item of invoice.items) {
			const type = item.billingType || 'Einmalig';
			byType.set(type, round2((byType.get(type) ?? 0) + item.quantity * item.unitPrice));
		}
		if (byType.size > 1) {
			for (const [type, amount] of byType) totalLine(`${type} exkl. MwSt.`, amount);
			totalLine('Gesamttotal exkl. MwSt.', totals.net, true);
		} else totalLine('Total exkl. MwSt.', totals.net, true);
	}

	// --- Payment terms ---
	const qrIssues = co.qrBillEnabled ? qrBillIssues(co, invoice.currency) : ['off'];
	const withQr = qrIssues.length === 0 && totals.total > 0;
	const reference = co.iban ? paymentReference(invoice.invoiceNumber, co.iban) : '';
	y -= 20;
	newPageIfBelow(120);
	text(`Zahlungsbedingungen: ${co.paymentTermsDays} Tage netto`, marginL, y);
	y -= 18;
	if (co.iban) {
		text(
			withQr
				? `Bitte zahlen Sie innerhalb von ${co.paymentTermsDays} Tagen mit dem QR-Zahlteil oder auf folgendes Konto:`
				: `Bitte zahlen Sie innerhalb von ${co.paymentTermsDays} Tagen auf folgendes Konto:`,
			marginL,
			y
		);
		y -= 18;
		text(
			`IBAN: ${formatIban(co.iban)}${co.bank ? `  |  Bank: ${co.bank}` : ''}${co.bic ? `  |  BIC: ${co.bic}` : ''}`,
			marginL,
			y
		);
		y -= 16;
	}
	text(
		`Zahlungsreferenz: ${withQr ? formatReference(reference) : invoice.invoiceNumber}`,
		marginL,
		y,
		10,
		fontBold
	);
	y -= 16;

	// --- Notes ---
	if (invoice.notes?.trim()) {
		y -= 30;
		newPageIfBelow(100);
		text('Notizen', marginL, y, 10, fontBold);
		y -= 16;
		for (const line of wrapText(winAnsi(invoice.notes), font, 9, marginR - marginL)) {
			newPageIfBelow(60);
			text(line, marginL, y, 9, font, gray);
			y -= 14;
		}
	}

	// --- QR payment part: bottom of the last page, own page when there is no room ---
	if (withQr) {
		// y = next line; the last text line (y + 16) must stay clear of the separation line and its hint
		if (y + 16 < 105 * MM + 18) page = pdfDoc.addPage(pageSize);
		await drawPaymentPart(page, font, fontBold, {
			iban: co.iban,
			creditor: co.creditor!,
			debtor: debtorAddress(r),
			amount: totals.total,
			currency: invoice.currency as 'CHF' | 'EUR',
			reference,
			message: `Rechnung ${invoice.invoiceNumber}`
		});
	}

	return pdfDoc.save();
}

interface PaymentPart {
	iban: string;
	creditor: QrAddress;
	debtor: QrAddress | null;
	amount: number;
	currency: 'CHF' | 'EUR';
	reference: string;
	message: string;
}

const addressText = (a: QrAddress) => [
	a.name,
	[a.street, a.buildingNumber].filter(Boolean).join(' '),
	`${a.country !== 'CH' ? `${a.country}-` : ''}${a.postalCode} ${a.city}`
];

/** Corner marks of an empty field (to be filled in by hand) */
function cornerBox(page: PDFPage, x: number, yTop: number, w: number, h: number) {
	const l = 3 * MM;
	const lines: Array<[number, number, number, number]> = [
		[x, yTop, x + l, yTop],
		[x, yTop, x, yTop - l],
		[x + w, yTop, x + w - l, yTop],
		[x + w, yTop, x + w, yTop - l],
		[x, yTop - h, x + l, yTop - h],
		[x, yTop - h, x, yTop - h + l],
		[x + w, yTop - h, x + w - l, yTop - h],
		[x + w, yTop - h, x + w, yTop - h + l]
	];
	for (const [x1, y1, x2, y2] of lines)
		page.drawLine({
			start: { x: x1, y: y1 },
			end: { x: x2, y: y2 },
			thickness: 0.75,
			color: black
		});
}

async function drawPaymentPart(page: PDFPage, font: PDFFont, bold: PDFFont, bill: PaymentPart) {
	const top = 105 * MM;
	const fromTop = (mm: number) => top - mm * MM;
	const amount = new Intl.NumberFormat('de-CH', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})
		.format(bill.amount)
		.replace(/[’']/g, ' ');
	const draw = (value: string, xMm: number, y: number, size: number, f: PDFFont = font) =>
		page.drawText(winAnsi(value), { x: xMm * MM, y, size, font: f, color: black });

	// Separation lines + hint (PDF sent by e-mail, printed on plain paper)
	page.drawLine({
		start: { x: 0, y: top },
		end: { x: page.getWidth(), y: top },
		thickness: 0.5,
		color: black,
		dashArray: [3, 3]
	});
	page.drawLine({
		start: { x: 62 * MM, y: 0 },
		end: { x: 62 * MM, y: top },
		thickness: 0.5,
		color: black,
		dashArray: [3, 3]
	});
	const hint = 'Vor der Einzahlung abzutrennen';
	page.drawText(hint, {
		x: (page.getWidth() - font.widthOfTextAtSize(hint, 7)) / 2,
		y: top + 3,
		size: 7,
		font,
		color: gray
	});

	// Block of heading + lines; returns the next y
	const block = (
		heading: string,
		lines: string[],
		xMm: number,
		y: number,
		headSize: number,
		valueSize: number
	) => {
		draw(heading, xMm, y, headSize, bold);
		y -= valueSize + 1;
		for (const line of lines) {
			draw(line, xMm, y, valueSize);
			y -= valueSize + 1;
		}
		return y - valueSize * 0.6;
	};

	// ── Receipt (Empfangsschein), 62 mm ──
	draw('Empfangsschein', 5, fromTop(5) - 11, 11, bold);
	let y = fromTop(12) - 6;
	y = block(
		'Konto / Zahlbar an',
		[formatIban(bill.iban), ...addressText(bill.creditor)],
		5,
		y,
		6,
		8
	);
	y = block('Referenz', [formatReference(bill.reference)], 5, y, 6, 8);
	if (bill.debtor) block('Zahlbar durch', addressText(bill.debtor), 5, y, 6, 8);
	else {
		draw('Zahlbar durch (Name/Adresse)', 5, y, 6, bold);
		cornerBox(page, 5 * MM, y - 3, 52 * MM, 20 * MM);
	}
	draw('Währung', 5, fromTop(68) - 6, 6, bold);
	draw('Betrag', 18, fromTop(68) - 6, 6, bold);
	draw(bill.currency, 5, fromTop(68) - 16, 8);
	draw(amount, 18, fromTop(68) - 16, 8);
	const acceptance = 'Annahmestelle';
	page.drawText(acceptance, {
		x: 57 * MM - bold.widthOfTextAtSize(acceptance, 6),
		y: fromTop(82) - 6,
		size: 6,
		font: bold,
		color: black
	});

	// ── Payment part (Zahlteil), 148 mm ──
	draw('Zahlteil', 67, fromTop(5) - 11, 11, bold);

	// QR code 46 × 46 mm with Swiss cross 7 × 7 mm
	const qr = QRCode.create(qrPayload(bill), { errorCorrectionLevel: 'M' });
	const count = qr.modules.size;
	const size = 46 * MM;
	const cell = size / count;
	const qrX = 67 * MM;
	const qrTop = fromTop(17);
	for (let row = 0; row < count; row++) {
		for (let col = 0; col < count; col++) {
			if (!qr.modules.get(row, col)) continue;
			page.drawRectangle({
				x: qrX + col * cell,
				y: qrTop - (row + 1) * cell,
				width: cell + 0.01,
				height: cell + 0.01,
				color: black
			});
		}
	}
	const cx = qrX + size / 2;
	const cy = qrTop - size / 2;
	const crossOuter = 7 * MM;
	const crossInner = crossOuter - 1 * MM;
	page.drawRectangle({
		x: cx - crossOuter / 2,
		y: cy - crossOuter / 2,
		width: crossOuter,
		height: crossOuter,
		color: white
	});
	page.drawRectangle({
		x: cx - crossInner / 2,
		y: cy - crossInner / 2,
		width: crossInner,
		height: crossInner,
		color: black
	});
	const armLong = crossInner * 0.6;
	const armShort = crossInner * 0.19;
	page.drawRectangle({
		x: cx - armShort / 2,
		y: cy - armLong / 2,
		width: armShort,
		height: armLong,
		color: white
	});
	page.drawRectangle({
		x: cx - armLong / 2,
		y: cy - armShort / 2,
		width: armLong,
		height: armShort,
		color: white
	});

	draw('Währung', 67, fromTop(68) - 8, 8, bold);
	draw('Betrag', 89, fromTop(68) - 8, 8, bold);
	draw(bill.currency, 67, fromTop(68) - 20, 10);
	draw(amount, 89, fromTop(68) - 20, 10);

	y = fromTop(5) - 8;
	y = block(
		'Konto / Zahlbar an',
		[formatIban(bill.iban), ...addressText(bill.creditor)],
		118,
		y,
		8,
		10
	);
	y = block('Referenz', [formatReference(bill.reference)], 118, y, 8, 10);
	if (bill.message) y = block('Zusätzliche Informationen', [bill.message], 118, y, 8, 10);
	if (bill.debtor) block('Zahlbar durch', addressText(bill.debtor), 118, y, 8, 10);
	else {
		draw('Zahlbar durch (Name/Adresse)', 118, y, 8, bold);
		cornerBox(page, 118 * MM, y - 3, 65 * MM, 25 * MM);
	}
}
