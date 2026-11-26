/**
 * Recurring invoices (admin «Jährlich wiederholen»): every invoice with an active `recurrence`
 * is a template. When `nextDate` is reached, a copy with a new number, today's date and QR bill
 * is created (source 'wiederkehrend', relatedId = template), mailed to the customer, and the
 * operator gets a short notice. Then nextDate moves on by one year (missed years are not
 * created afterwards). Runs daily (netlify/functions/wiederkehrende-rechnungen.ts →
 * /api/cron/wiederkehrende-rechnungen) and when /admin/rechnungen is opened.
 */
import { env } from '$env/dynamic/private';
import { listManualInvoices, updateManualInvoice } from '$lib/server/invoices';
import { createInvoice, loadInvoiceSettings, sendInvoiceMail } from '$lib/server/invoicing';
import { recurringInvoiceMail, recurringOperatorMail } from '$lib/server/invoiceMails';
import { getMailFrom, getNotifyTo, getTextStyle } from '$lib/server/mailFrom';

/** Today as YYYY-MM-DD in Swiss time */
export const todaySwiss = () =>
	new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date());

/** Same day one year later (29.2. → 28.2.) */
export function addYear(date: string): string {
	const [y, m, d] = date.split('-').map(Number);
	const last = new Date(Date.UTC(y + 1, m, 0)).getUTCDate();
	return `${y + 1}-${String(m).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}

/** Next due date after today (skips missed years) */
function nextAfterToday(date: string, today: string): string {
	let next = addYear(date);
	while (next <= today) next = addYear(next);
	return next;
}

async function notifyOperator({ subject, text }: { subject: string; text: string }) {
	const resendKey = env.RESEND_API_KEY;
	const [from, to] = await Promise.all([getMailFrom(), getNotifyTo()]);
	if (!resendKey || !from || !to) return;
	const { Resend } = await import('resend');
	const { error } = await new Resend(resendKey).emails.send({ from, to, subject, text });
	if (error) console.error('[wiederkehrende-rechnungen] Info-Mail fehlgeschlagen:', error);
}

/** Creates and mails all due recurring invoices; returns the new invoice numbers */
export async function sendDueRecurringInvoices(): Promise<string[]> {
	const today = todaySwiss();
	const due = (await listManualInvoices()).filter(
		(inv) => inv.recurrence?.active && inv.recurrence.nextDate <= today
	);
	if (!due.length) return [];

	const settings = await loadInvoiceSettings();
	const style = await getTextStyle();
	const created: string[] = [];
	for (const template of due) {
		try {
			const invoice = await createInvoice({
				source: 'wiederkehrend',
				relatedId: template.id,
				recipient: {
					vorname: template.vorname,
					nachname: template.nachname,
					firma: template.firma,
					email: template.email,
					adresse: template.adresse,
					plz: template.plz,
					ort: template.ort,
					land: template.land
				},
				items: template.items,
				notes: template.notes,
				currency: template.currency,
				showQuantity: true,
				settings
			});
			// Move on first: a failed mail must not create the invoice again tomorrow
			await updateManualInvoice(template.id, {
				recurrence: {
					...template.recurrence!,
					nextDate: nextAfterToday(template.recurrence!.nextDate, today)
				}
			});
			created.push(invoice.invoiceNumber);

			const name = [template.vorname, template.nachname].filter(Boolean).join(' ');
			const sent =
				!!template.email &&
				(await sendInvoiceMail({
					id: invoice.id,
					invoiceNumber: invoice.invoiceNumber,
					pdf: invoice.pdf,
					to: template.email,
					...recurringInvoiceMail({
						invoiceNumber: invoice.invoiceNumber,
						name,
						companyName: settings.name,
						style
					})
				}));
			await notifyOperator(
				recurringOperatorMail({
					invoiceNumber: invoice.invoiceNumber,
					templateNumber: template.invoiceNumber,
					name: name || template.firma || '',
					sentTo: sent ? template.email! : null,
					nextDate: nextAfterToday(template.recurrence!.nextDate, today)
				})
			).catch((e) => console.error('[wiederkehrende-rechnungen] Info-Mail:', e));
		} catch (e) {
			console.error(`[wiederkehrende-rechnungen] ${template.invoiceNumber} fehlgeschlagen:`, e);
		}
	}
	return created;
}
