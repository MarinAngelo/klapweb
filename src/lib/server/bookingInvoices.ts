/**
 * Invoices of appointment bookings — sent after the appointment has ended
 * (setting «Rechnung nach dem Termin senden», offers with «Preis»).
 *
 * The booking stores `invoicePending` + price + billing address; this job issues the invoice
 * via the invoice module and e-mails it. Called hourly by netlify/functions/termin-rechnungen.ts
 * (→ /api/cron/termin-rechnungen) and when the admin «Terminverwaltung» is opened.
 */
import { listBookings, updateBooking, type BookingRecord } from '$lib/server/bookings';
import { createInvoice, loadInvoiceSettings, sendInvoiceMail } from '$lib/server/invoicing';
import { formatDateWithWeekday, SITE_TIME_ZONE, zonedTimeToUtc } from '$lib/utils/formatDate';

/** End of the appointment (without buffer); start when there is no end time */
function appointmentEnd(booking: BookingRecord): number {
	const zone = booking.zeitzone || SITE_TIME_ZONE;
	return zonedTimeToUtc(booking.datum, booking.endzeit || booking.uhrzeit || '23:59', zone);
}

const splitName = (name = '') => {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	return parts.length > 1
		? { vorname: parts.slice(0, -1).join(' '), nachname: parts[parts.length - 1] }
		: { vorname: parts[0] ?? '', nachname: '' };
};

/** Issues and sends all due booking invoices; returns the invoice numbers created */
export async function sendDueBookingInvoices(now = Date.now()): Promise<string[]> {
	const due = (await listBookings()).filter(
		(b) => b.invoicePending && b.price && b.datum && appointmentEnd(b) <= now
	);
	if (!due.length) return [];

	const settings = await loadInvoiceSettings();
	const created: string[] = [];
	for (const booking of due) {
		// Claim first: a parallel run (cron + admin page) must not invoice twice
		await updateBooking(booking.terminId, { invoicePending: false });
		try {
			const dateLabel = formatDateWithWeekday(
				booking.datum,
				booking.uhrzeit || null,
				'de-CH',
				'long'
			);
			const invoice = await createInvoice({
				source: 'terminbuchung',
				relatedId: booking.terminId,
				recipient: {
					...splitName(booking.name),
					email: booking.email,
					tel: booking.telefon,
					...booking.invoiceAddress
				},
				items: [
					{ description: `${booking.titel} – ${dateLabel}`, quantity: 1, unitPrice: booking.price! }
				],
				settings
			});
			await updateBooking(booking.terminId, { invoiceNumber: invoice.invoiceNumber });
			created.push(invoice.invoiceNumber);
			if (booking.email) {
				await sendInvoiceMail({
					id: invoice.id,
					invoiceNumber: invoice.invoiceNumber,
					pdf: invoice.pdf,
					to: booking.email,
					subject: `Ihre Rechnung ${invoice.invoiceNumber}${settings.name ? ` – ${settings.name}` : ''}`,
					text: [
						`Guten Tag${booking.name ? ' ' + booking.name : ''}`,
						``,
						`Vielen Dank für Ihren Besuch. Im Anhang finden Sie die Rechnung für:`,
						``,
						`${booking.titel}`,
						dateLabel,
						``,
						`Freundliche Grüsse`,
						settings.name
					].join('\n')
				});
			}
		} catch (e) {
			console.error(`Rechnung zur Buchung ${booking.terminId} fehlgeschlagen:`, e);
			// Next run tries again
			await updateBooking(booking.terminId, { invoicePending: true }).catch(() => {});
		}
	}
	return created;
}
