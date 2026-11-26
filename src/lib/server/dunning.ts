/**
 * Dunning (Mahnwesen): Settings › Rechnungen «Automatisch mahnen».
 *
 * An unpaid invoice (status 'offen' or 'gemahnt', not cash) is reminded when its deadline plus
 * «Mahnung nach Ablauf der Zahlungsfrist (Tage)» has passed. Deadline = invoice date + «Zahlungsfrist»,
 * after a reminder = the reminder's new deadline (today + «Neue Zahlungsfrist in der Mahnung»).
 * Two levels; afterwards the operator is notified once. Each reminder mails the invoice PDF
 * (same amount and QR bill) and sets the status to 'gemahnt'.
 * Runs daily (netlify/functions/mahnungen.ts → /api/cron/mahnungen) and when /admin/rechnungen opens.
 */
import { env } from '$env/dynamic/private';
import {
	listManualInvoices,
	updateManualInvoice,
	type ManualInvoiceRecord
} from '$lib/server/invoices';
import {
	documentFromRecord,
	invoiceAttachment,
	invoiceTotals,
	loadInvoiceSettings,
	renderInvoicePdf,
	type InvoiceSettings
} from '$lib/server/invoicing';
import { getMailFrom, getNotifyTo, getTextStyle } from '$lib/server/mailFrom';
import { dunningMail, dunningOperatorMail } from '$lib/server/invoiceMails';
import { createClient } from '$lib/prismicio';
import { loadMailTheme } from '$lib/mailLayout.js';

export const MAX_DUNNING_LEVEL = 2;

/** Today as YYYY-MM-DD in Swiss time */
const todaySwiss = () =>
	new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date());
const swissDay = (iso: string) =>
	new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date(iso));
function addDays(day: string, days: number): string {
	const d = new Date(`${day}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}
const formatDay = (day: string) => day.split('-').reverse().join('.');

/** Current deadline of an invoice (YYYY-MM-DD) */
export function invoiceDeadline(inv: ManualInvoiceRecord, settings: InvoiceSettings): string {
	const last = inv.dunning?.at(-1);
	return last ? last.dueDate : addDays(swissDay(inv.date), settings.paymentTermsDays);
}

async function sendMail(options: {
	to: string;
	subject: string;
	text: string;
	html?: string;
	attachments?: { filename: string; content: string }[];
}): Promise<boolean> {
	const resendKey = env.RESEND_API_KEY;
	const from = await getMailFrom();
	if (!resendKey || !from || !options.to) return false;
	const { Resend } = await import('resend');
	const { error } = await new Resend(resendKey).emails.send({ from, ...options });
	if (error) console.error('[mahnungen] Mail fehlgeschlagen:', error);
	return !error;
}

/** Sends all due reminders; returns the invoice numbers that were reminded */
export async function sendDueReminders(): Promise<string[]> {
	const settings = await loadInvoiceSettings();
	if (!settings.dunningActive) return [];
	const today = todaySwiss();
	const candidates = (await listManualInvoices()).filter(
		(inv) =>
			(inv.paymentStatus === 'offen' || inv.paymentStatus === 'gemahnt') &&
			inv.paymentMethod !== 'bar' &&
			!inv.dunningDone &&
			addDays(invoiceDeadline(inv, settings), settings.dunningDays) <= today
	);
	if (!candidates.length) return [];

	const style = await getTextStyle();
	// Reminders in the page colours
	const theme = await loadMailTheme(createClient()).catch(() => null);
	const reminded: string[] = [];
	const notes: string[] = [];
	for (const inv of candidates) {
		const name = [inv.vorname, inv.nachname].filter(Boolean).join(' ') || inv.firma || '';
		const level = (inv.dunning?.length ?? 0) + 1;
		try {
			if (level > MAX_DUNNING_LEVEL) {
				await updateManualInvoice(inv.id, { dunningDone: true });
				notes.push(
					`${inv.invoiceNumber} (${name}): auch nach der ${MAX_DUNNING_LEVEL}. Mahnung nicht bezahlt — bitte selbst nachfassen.`
				);
				continue;
			}
			const dueDate = addDays(today, settings.dunningTermsDays);
			const pdf = await renderInvoicePdf(documentFromRecord(inv), settings);
			const total =
				typeof inv.total === 'number'
					? inv.total
					: invoiceTotals(inv.items ?? [], settings.vatRate).total;
			const sent =
				!!inv.email &&
				(await sendMail({
					to: inv.email,
					...dunningMail({
						level,
						invoiceNumber: inv.invoiceNumber,
						invoiceDate: formatDay(swissDay(inv.date)),
						amount: `${inv.currency || settings.currency} ${total.toFixed(2)}`,
						dueDate: formatDay(dueDate),
						name,
						companyName: settings.name,
						style,
						theme
					}),
					attachments: [invoiceAttachment(inv.invoiceNumber, pdf)]
				}));
			await updateManualInvoice(inv.id, {
				paymentStatus: 'gemahnt',
				dunning: [...(inv.dunning ?? []), { level, at: new Date().toISOString(), dueDate, sent }]
			});
			reminded.push(inv.invoiceNumber);
			notes.push(
				sent
					? `${inv.invoiceNumber} (${name}): ${level}. Mahnung an ${inv.email} gesendet, neue Frist ${formatDay(dueDate)}.`
					: `${inv.invoiceNumber} (${name}): ${level}. Mahnung NICHT gemailt (keine E-Mail-Adresse oder Versand fehlgeschlagen) — bitte selbst mahnen.`
			);
		} catch (e) {
			console.error(`[mahnungen] ${inv.invoiceNumber} fehlgeschlagen:`, e);
		}
	}

	if (notes.length) {
		const to = await getNotifyTo();
		await sendMail({
			to,
			...dunningOperatorMail(notes)
		}).catch((e) => console.error('[mahnungen] Info-Mail:', e));
	}
	return reminded;
}
