import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	listManualInvoices,
	deleteManualInvoice,
	getManualInvoice,
	updateManualInvoice
} from '$lib/server/invoices';
import { listCustomers } from '$lib/server/customers';
import { createClient } from '$lib/prismicio';
import { FEATURE_ECOMMERCE } from '$lib/server/features';
import { addYear, sendDueRecurringInvoices } from '$lib/server/recurringInvoices';
import { sendDueReminders } from '$lib/server/dunning';
import { adminInvoiceMail } from '$lib/server/invoiceMails';
import { getTextStyle } from '$lib/server/mailFrom';
import { reconcilePayments } from '$lib/server/paymentMatching';
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

/** Leistungen (feature ecommerce) for the line items: label + price excl. VAT, main language */
async function loadServices(fetchFn: typeof fetch) {
	if (!FEATURE_ECOMMERCE) return [];
	try {
		const docs = await createClient({ fetch: fetchFn }).getAllByType('leistung');
		return docs
			.map((doc) => {
				const d = doc.data as Record<string, unknown>;
				return {
					uid: doc.uid ?? doc.id,
					label: (d.label as string) || doc.uid || '',
					price: typeof d.price_chf === 'number' ? d.price_chf : null
				};
			})
			.sort((a, b) => a.label.localeCompare(b.label, 'de'));
	} catch (e) {
		console.error('[rechnungen] Leistungen konnten nicht geladen werden:', e);
		return [];
	}
}

export const load: PageServerLoad = async ({ fetch }) => {
	// Due recurring invoices are also created when the admin opens the page (besides the daily cron)
	await sendDueRecurringInvoices().catch((e) => console.error('Wiederkehrende Rechnungen:', e));
	// Same for due reminders («Automatisch mahnen»)
	await sendDueReminders().catch((e) => console.error('Mahnungen:', e));
	const [invoices, customers, services] = await Promise.all([
		listManualInvoices(),
		listCustomers(),
		loadServices(fetch)
	]);

	const settings = await loadInvoiceSettings(fetch);
	// Only what the page shows (no raw settings to the browser)
	const companyInfo = { currency: settings.currency };

	return { invoices, customers, companyInfo, services };
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

		// «Jährlich wiederholen»: next invoice one year after the invoice date
		if (formData.get('recurring') === 'true') {
			const invoiceDay = (invoiceDateFrom(formData) ?? '').slice(0, 10) || todaySwiss();
			await updateManualInvoice(invoiceId, {
				recurrence: { interval: 'jaehrlich', nextDate: addYear(invoiceDay), active: true }
			});
		}

		// E-Mail versenden wenn gewünscht
		if (sendEmail && invoiceData.email) {
			await sendInvoiceMail({
				id: invoiceId,
				invoiceNumber,
				pdf: created.pdf,
				to: invoiceData.email,
				...adminInvoiceMail({
					invoiceNumber,
					name: [invoiceData.vorname, invoiceData.nachname].filter(Boolean).join(' '),
					companyName: created.settings.name,
					style: await getTextStyle()
				})
			});
		}

		const savedInvoice = await getManualInvoice(invoiceId);
		return { success: true, invoiceNumber, invoice: savedInvoice };
	},

	/** Zahlungsabgleich: bank export (CSV) → mark matching invoices as paid (or only check) */
	reconcile: async ({ request }) => {
		const form = await request.formData();
		const file = form.get('csv');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { reconcileError: 'Bitte eine CSV-Datei wählen' });
		}
		if (file.size > 5 * 1024 * 1024)
			return fail(400, { reconcileError: 'Die Datei ist grösser als 5 MB' });
		const buffer = new Uint8Array(await file.arrayBuffer());
		// Bank exports are UTF-8 or Windows-1252 (Latin-1)
		let text = new TextDecoder('utf-8').decode(buffer);
		if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(buffer);
		const dryRun = form.get('dry-run') === 'on';
		const matchResults = await reconcilePayments(text, dryRun);
		return { matchResults, dryRun, fileName: file.name };
	},

	/** Bulk actions of the invoice list (AdminBulkActions): action + ids (JSON) */
	bulk: async ({ request }) => {
		const formData = await request.formData();
		const action = String(formData.get('action') ?? '');
		let ids: string[] = [];
		try {
			ids = JSON.parse(String(formData.get('ids') ?? '[]'));
		} catch {
			throw error(400, 'Ungültige Auswahl');
		}
		if (!Array.isArray(ids) || !ids.length) throw error(400, 'Keine Rechnungen ausgewählt');
		const paymentStatus = ({ paid: 'bezahlt', open: 'offen', cancelled: 'storniert' } as const)[
			action as 'paid' | 'open' | 'cancelled'
		];
		if (paymentStatus) {
			await Promise.all(ids.map((id) => updateManualInvoice(String(id), { paymentStatus })));
			return { success: true, count: ids.length };
		}
		switch (action) {
			case 'delete':
				await Promise.all(ids.map((id) => deleteManualInvoice(String(id))));
				return { success: true, count: ids.length };
			default:
				throw error(400, 'Unbekannte Aktion');
		}
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
					(formData.get('payment-status') as 'offen' | 'gemahnt' | 'bezahlt' | 'storniert') ||
					'offen',
				...paidAtFrom(formData),
				...recurrenceFrom(formData)
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
			...adminInvoiceMail({
				invoiceNumber: invoice.invoiceNumber,
				name: customerName,
				companyName: companyInfo.name,
				style: await getTextStyle()
			})
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

/** «Bezahlt am» of the edit form (YYYY-MM-DD); empty → set automatically when it becomes paid */
function paidAtFrom(formData: FormData) {
	const value = String(formData.get('paid-date') ?? '');
	if (formData.get('payment-status') !== 'bezahlt' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return {};
	if (value > todaySwiss()) throw error(400, 'Das Zahlungsdatum darf nicht in der Zukunft liegen');
	return { paidAt: `${value}T12:00:00.000Z` };
}

/** «Wiederholung» of the edit form: active + date of the next invoice (YYYY-MM-DD) */
function recurrenceFrom(formData: FormData) {
	if (!formData.has('recurring-active')) return {};
	const active = formData.get('recurring-active') === 'true';
	const nextDate = String(formData.get('recurring-next') ?? '');
	if (!active) return { recurrence: undefined };
	if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) throw error(400, 'Datum der nächsten Rechnung fehlt');
	return { recurrence: { interval: 'jaehrlich' as const, nextDate, active: true } };
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
