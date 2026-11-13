/**
 * Invoice issuer data from the Prismic settings (tab «Rechnungen» + responsible person/address).
 * One loader for every feature that issues invoices (checkout, admin, appointment booking …).
 */
import { createClient } from '$lib/prismicio';
import { parseCurrencyCode } from '$lib/pricing';
import { parseAddress, qrBillProblems, type QrAddress } from '$lib/qrBill.js';

export interface InvoiceSettings {
	name: string;
	/** Free address lines (as entered in «Verantwortliche Adresse») */
	address: string;
	email: string;
	uid: string;
	iban: string;
	bank: string;
	bic: string;
	paymentTermsDays: number;
	vatRate: number | null;
	currency: string;
	/** «QR-Zahlteil auf Rechnungen» (on by default) */
	qrBillEnabled: boolean;
	/** Structured issuer address for the QR bill; null = not recognisable */
	creditor: QrAddress | null;
	/** Raw settings data for feature-specific fields (e-mail templates, discount codes …) */
	data: Record<string, unknown>;
}

const richTextLines = (value: unknown): string[] =>
	Array.isArray(value)
		? (value as Array<{ text?: string }>).map((b) => b?.text ?? '').filter(Boolean)
		: [];

export function invoiceSettingsFrom(d: Record<string, unknown>): InvoiceSettings {
	const name = (d.responsible_person_company as string) ?? '';
	const addressLines = richTextLines(d.responsible_address);
	return {
		name,
		address: addressLines.join('\n'),
		email: (d.responsible_email as string) ?? (d.e_mail as string) ?? '',
		uid: (d.company_identification_number as string) ?? '',
		iban: (d.invoice_iban as string) ?? '',
		bank: (d.invoice_bank as string) ?? '',
		bic: (d.invoice_bic as string) ?? '',
		paymentTermsDays: (d.invoice_payment_terms_days as number) ?? 30,
		vatRate: (d.invoice_vat_rate as number) ?? null,
		currency: parseCurrencyCode(d.invoice_currency as string) || 'CHF',
		qrBillEnabled: d.invoice_qr_bill !== false,
		creditor: parseAddress(name, addressLines),
		data: d
	};
}

/** Settings of the main language (invoices are issued by the same company in every language) */
export async function loadInvoiceSettings(
	fetch: typeof globalThis.fetch = globalThis.fetch
): Promise<InvoiceSettings> {
	try {
		const settings = await createClient({ fetch }).getSingle('settings');
		return invoiceSettingsFrom(settings.data as Record<string, unknown>);
	} catch (e) {
		console.error('Rechnungs-Einstellungen konnten nicht geladen werden:', e);
		return invoiceSettingsFrom({});
	}
}

/** Problems that prevent the QR payment part ([] = it is printed) */
export function qrBillIssues(settings: InvoiceSettings, currency = settings.currency): string[] {
	return qrBillProblems({ iban: settings.iban, creditor: settings.creditor, currency });
}
