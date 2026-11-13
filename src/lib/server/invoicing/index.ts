/**
 * Invoice module — entry point for every feature that bills something
 * (checkout, admin «Rechnungen», appointment booking …):
 *
 *   const { pdf, invoiceNumber } = await createInvoice({
 *     source: 'terminbuchung', relatedId: terminId,
 *     recipient: { vorname, nachname, email }, items: [{ description, quantity: 1, unitPrice }]
 *   });
 *
 * Stores the invoice (Blob store `manuelle_rechnungen`, visible in /admin/rechnungen) and renders
 * the PDF incl. Swiss QR payment part. Sending is up to the caller (own mail text), helpers below.
 */
import { env } from '$env/dynamic/private';
import { getMailFrom } from '$lib/server/mailFrom';
import {
	saveManualInvoice,
	updateManualInvoice,
	type InvoiceSource,
	type ManualInvoiceRecord
} from '$lib/server/invoices';
import { invoiceTotals, paymentReference, renderInvoicePdf } from './pdf';
import type { InvoiceDocument, InvoiceItem, InvoiceRecipient } from './pdf';
import { loadInvoiceSettings, type InvoiceSettings } from './settings';

export { loadInvoiceSettings, invoiceSettingsFrom, qrBillIssues } from './settings';
export type { InvoiceSettings } from './settings';
export { renderInvoicePdf, invoiceTotals } from './pdf';
export type { InvoiceDocument, InvoiceItem, InvoiceRecipient } from './pdf';

export interface CreateInvoiceInput {
	source: InvoiceSource;
	/** Id in the source feature (e.g. booking terminId) */
	relatedId?: string;
	recipient: InvoiceRecipient;
	items: InvoiceItem[];
	currency?: string;
	notes?: string;
	invoiceNumber?: string;
	paymentMethod?: 'rechnung' | 'bar';
	paymentStatus?: 'offen' | 'bezahlt' | 'storniert';
	showQuantity?: boolean;
	/** Already loaded settings (saves a Prismic request) */
	settings?: InvoiceSettings;
	fetch?: typeof globalThis.fetch;
	/** false = only render (preview), nothing stored */
	save?: boolean;
}

export interface CreatedInvoice {
	/** Blob id; null when not stored (preview or storage failed) */
	id: string | null;
	invoiceNumber: string;
	pdf: Uint8Array;
	total: number;
	reference: string;
	settings: InvoiceSettings;
}

export const newInvoiceNumber = (prefix = 'INV') => `${prefix}-${Date.now()}`;

/** Invoice document of a stored record (PDF again, e.g. in the admin) */
export function documentFromRecord(record: ManualInvoiceRecord): InvoiceDocument {
	return {
		invoiceNumber: record.invoiceNumber,
		date: record.date,
		currency: record.currency || 'CHF',
		recipient: {
			vorname: record.vorname,
			nachname: record.nachname,
			firma: record.firma,
			email: record.email,
			adresse: record.adresse,
			plz: record.plz,
			ort: record.ort,
			land: record.land
		},
		items: record.items,
		notes: record.notes,
		showQuantity: record.source === 'admin' || !record.source
	};
}

export async function createInvoice(input: CreateInvoiceInput): Promise<CreatedInvoice> {
	const settings = input.settings ?? (await loadInvoiceSettings(input.fetch));
	const invoiceNumber = input.invoiceNumber || newInvoiceNumber();
	const currency = input.currency || settings.currency;
	const date = new Date().toISOString();
	const document: InvoiceDocument = {
		invoiceNumber,
		date,
		currency,
		recipient: input.recipient,
		items: input.items,
		notes: input.notes,
		showQuantity: input.showQuantity
	};
	const pdf = await renderInvoicePdf(document, settings);
	const reference = settings.iban ? paymentReference(invoiceNumber, settings.iban) : '';
	const { total } = invoiceTotals(input.items, settings.vatRate);

	let id: string | null = null;
	if (input.save !== false) {
		try {
			const r = input.recipient;
			id = await saveManualInvoice({
				invoiceNumber,
				date,
				status: 'gespeichert',
				paymentStatus: input.paymentStatus ?? 'offen',
				paymentMethod: input.paymentMethod ?? 'rechnung',
				source: input.source,
				relatedId: input.relatedId,
				reference: reference || undefined,
				vorname: r.vorname ?? '',
				nachname: r.nachname ?? '',
				firma: r.firma || undefined,
				email: r.email || undefined,
				adresse: r.adresse || undefined,
				plz: r.plz || undefined,
				ort: r.ort || undefined,
				land: r.land || undefined,
				items: input.items,
				notes: input.notes || undefined,
				currency
			});
		} catch (e) {
			console.error('Rechnung konnte nicht gespeichert werden:', e);
		}
	}
	return { id, invoiceNumber, pdf, total, reference, settings };
}

/** PDF as Resend attachment */
export const invoiceAttachment = (invoiceNumber: string, pdf: Uint8Array) => ({
	filename: `Rechnung_${invoiceNumber}.pdf`,
	content: Buffer.from(pdf).toString('base64')
});

/**
 * Sends an invoice by e-mail and marks it «gesendet». Returns false when Resend / sender is
 * missing or the mail failed (the invoice stays «gespeichert»).
 */
export async function sendInvoiceMail(options: {
	id: string | null;
	invoiceNumber: string;
	pdf: Uint8Array;
	to: string;
	subject: string;
	text: string;
	replyTo?: string;
}): Promise<boolean> {
	const resendKey = env.RESEND_API_KEY;
	const from = await getMailFrom();
	if (!resendKey || !from || !options.to) return false;
	try {
		const { Resend } = await import('resend');
		const { error } = await new Resend(resendKey).emails.send({
			from,
			to: options.to,
			subject: options.subject,
			text: options.text,
			...(options.replyTo ? { replyTo: options.replyTo } : {}),
			attachments: [invoiceAttachment(options.invoiceNumber, options.pdf)]
		});
		if (error) {
			console.error('Rechnungs-E-Mail fehlgeschlagen:', error);
			return false;
		}
	} catch (e) {
		console.error('Rechnungs-E-Mail fehlgeschlagen:', e);
		return false;
	}
	if (options.id) {
		await updateManualInvoice(options.id, {
			status: 'gesendet',
			emailSentAt: new Date().toISOString()
		}).catch((e) => console.error('Rechnungs-Status nicht aktualisiert:', e));
	}
	return true;
}
