import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	listManualInvoices,
	deleteManualInvoice,
	getManualInvoice,
	updateManualInvoice
} from '$lib/server/invoices';
import { listCustomers } from '$lib/server/customers';
import {
	createInvoice,
	documentFromRecord,
	loadInvoiceSettings,
	renderInvoicePdf,
	sendInvoiceMail,
	type InvoiceItem,
	type InvoiceRecipient,
	type InvoiceSettings
} from '$lib/server/invoicing';

// Zugriff: /admin/* ist zentral in hooks.server.ts geschützt (Admin-Session)

export const load: PageServerLoad = async ({ fetch }) => {
	const [invoices, customers] = await Promise.all([listManualInvoices(), listCustomers()]);

	const settings = await loadInvoiceSettings(fetch);
	// Only what the page shows (no raw settings to the browser)
	const companyInfo = { currency: settings.currency };

	return { invoices, customers, companyInfo };
};

export const actions: Actions = {
	preview: async ({ request, fetch }) => {
		const formData = await request.formData();
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

		const companyInfo = await loadInvoiceSettings(fetch);

		const invoiceNumber = `MAN-${Date.now()}`;
		const pdfBytes = await manualPdf(
			invoiceNumber,
			invoiceData,
			companyInfo,
			invoiceDateFrom(formData)
		);

		return {
			success: true,
			pdfBase64: Buffer.from(pdfBytes).toString('base64'),
			invoiceNumber,
			itemsJson
		};
	},

	save: async ({ request, fetch }) => {
		const formData = await request.formData();
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

		const { recipient, notes } = splitInvoiceData(invoiceData);
		const created = await createInvoice({
			source: 'admin',
			invoiceNumber,
			date: invoiceDateFrom(formData),
			recipient,
			items,
			notes,
			showQuantity: true,
			fetch
		});
		if (!created.id) throw error(500, 'Rechnung konnte nicht gespeichert werden');
		const invoiceId = created.id;

		// E-Mail versenden wenn gewünscht
		if (sendEmail && invoiceData.email) {
			await sendInvoiceMail({
				id: invoiceId,
				invoiceNumber,
				pdf: created.pdf,
				to: invoiceData.email,
				subject: `Ihre Rechnung ${invoiceNumber} – ${created.settings.name}`,
				text: `Sehr geehrte/r ${invoiceData.vorname} ${invoiceData.nachname},\n\nVielen Dank für Ihren Auftrag. Bitte finden Sie Ihre Rechnung im Anhang.\n\nFreundliche Grüsse\n${created.settings.name}`
			});
		}

		const savedInvoice = await getManualInvoice(invoiceId);
		return { success: true, invoiceNumber, invoice: savedInvoice };
	},

	delete: async ({ request, fetch }) => {
		const formData = await request.formData();

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

	deleteAll: async () => {
		const all = await listManualInvoices();
		await Promise.all(all.map((inv) => deleteManualInvoice(inv.id)));
		return { success: true };
	},

	edit: async ({ request, fetch }) => {
		const formData = await request.formData();

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
				paymentStatus:
					(formData.get('payment-status') as 'offen' | 'bezahlt' | 'storniert') || 'offen'
			});

			return { success: true };
		} catch (e) {
			console.error('Rechnung aktualisieren fehlgeschlagen:', e);
			throw error(500, 'Rechnung konnte nicht aktualisiert werden');
		}
	},

	previewEditPdf: async ({ request, fetch }) => {
		const formData = await request.formData();

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

		const companyInfo = await loadInvoiceSettings(fetch);

		// Date of the stored invoice (not today), read on the server
		const invoiceId = formData.get('invoice-id') as string;
		const stored = invoiceId ? await getManualInvoice(invoiceId).catch(() => null) : null;
		const pdfBytes = await manualPdf(invoiceNumber, invoiceData, companyInfo, stored?.date);
		return {
			pdfBase64: Buffer.from(pdfBytes).toString('base64')
		};
	},

	sendInvoiceEmail: async ({ request, fetch }) => {
		const formData = await request.formData();

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

		const companyInfo = await loadInvoiceSettings(fetch);

		const pdfBytes = await renderInvoicePdf(documentFromRecord(invoice), companyInfo);
		const customerName = [invoice.vorname, invoice.nachname].filter(Boolean).join(' ');
		const sent = await sendInvoiceMail({
			id: invoiceId,
			invoiceNumber: invoice.invoiceNumber,
			pdf: pdfBytes,
			to: invoice.email,
			subject: `Ihre Rechnung ${invoice.invoiceNumber} – ${companyInfo.name}`,
			text: `Sehr geehrte/r ${customerName},\n\nVielen Dank für Ihren Auftrag. Bitte finden Sie Ihre Rechnung im Anhang.\n\nFreundliche Grüsse\n${companyInfo.name}`
		});
		if (!sent) throw error(500, 'E-Mail konnte nicht versendet werden');
		return { success: true };
	}
};

type InvoiceFormData = InvoiceRecipient & { items: InvoiceItem[]; notes?: string };

function splitInvoiceData({ items, notes, ...recipient }: InvoiceFormData) {
	return { recipient, items, notes };
}

/** PDF of the admin form (manual invoice, column «Menge») */
function manualPdf(
	invoiceNumber: string,
	data: InvoiceFormData,
	settings: InvoiceSettings,
	date?: string
) {
	const { recipient, items, notes } = splitInvoiceData(data);
	return renderInvoicePdf(
		{
			invoiceNumber,
			date,
			currency: settings.currency,
			recipient,
			items,
			notes,
			showQuantity: true
		},
		settings
	);
}

/** Today as YYYY-MM-DD in Swiss time */
const todaySwiss = () =>
	new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date());

/**
 * «Rechnungsdatum» of the form (YYYY-MM-DD): may be in the past, never in the future.
 * Today/empty → now; earlier day → noon UTC of that day (same calendar day in every time zone
 * used for display). Invalid or future → error.
 */
function invoiceDateFrom(formData: FormData): string | undefined {
	const value = String(formData.get('invoice-date') ?? '').trim();
	if (!value || value === todaySwiss()) return undefined;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
		throw error(400, 'Ungültiges Rechnungsdatum');
	}
	if (value > todaySwiss()) throw error(400, 'Das Rechnungsdatum darf nicht in der Zukunft liegen');
	return `${value}T12:00:00.000Z`;
}
