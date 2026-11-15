/**
 * Cancellation of appointment bookings (link in the confirmation e-mail → /termin-stornieren).
 *
 * Terms are stored with the booking (buche-termin): until `cancelFreeUntil` free of charge,
 * afterwards a fee of `cancelFeePercent` % of the price (invoice incl. QR bill via the invoice
 * module), without fee % no online cancellation after the deadline.
 */
import { env } from '$env/dynamic/private';
import { deleteBooking, type BookingRecord } from '$lib/server/bookings';
import { listManualInvoices, updateManualInvoice } from '$lib/server/invoices';
import { createInvoice, loadInvoiceSettings, sendInvoiceMail } from '$lib/server/invoicing';
import { getMailFrom, getNotifyTo } from '$lib/server/mailFrom';
import { invalidateTermineCache } from '$lib/server/termineCache';
import { formatDateWithWeekday, SITE_TIME_ZONE, zonedTimeToUtc } from '$lib/utils/formatDate';

export type CancelStatus =
	/** free of charge (within the deadline or no deadline) */
	| 'free'
	/** after the deadline, with fee */
	| 'fee'
	/** after the deadline without fee % (or offer without price) → contact the provider */
	| 'contact'
	/** appointment has started */
	| 'past';

export interface CancelTerms {
	status: CancelStatus;
	/** «Montag, 09.11.2026, 09:00» — end of the free cancellation, null = always free */
	freeUntilLabel: string | null;
	fee: number | null;
	feePercent: number | null;
	price: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Deadline (ISO) for a booking: appointment start minus «Kostenlos stornierbar bis» hours */
export function cancelDeadline(
	datum: string,
	uhrzeit: string,
	zeitzone: string | undefined,
	hours: number | null
): string | undefined {
	if (!hours || hours <= 0 || !datum) return undefined;
	const start = zonedTimeToUtc(datum, uhrzeit || '00:00', zeitzone || SITE_TIME_ZONE);
	return new Date(start - hours * 3600000).toISOString();
}

/** Deadline as local date + time of the appointment's time zone */
export function formatDeadline(iso: string, timeZone = SITE_TIME_ZONE): string {
	return new Intl.DateTimeFormat('de-CH', {
		timeZone,
		weekday: 'long',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(iso));
}

export function cancelTerms(booking: BookingRecord, now = Date.now()): CancelTerms {
	const zone = booking.zeitzone || SITE_TIME_ZONE;
	const start = booking.datum
		? zonedTimeToUtc(booking.datum, booking.uhrzeit || '00:00', zone)
		: Infinity;
	const price = booking.price && booking.price > 0 ? booking.price : null;
	const feePercent =
		booking.cancelFeePercent && booking.cancelFeePercent > 0
			? Math.min(booking.cancelFeePercent, 100)
			: null;
	const terms = {
		freeUntilLabel: booking.cancelFreeUntil ? formatDeadline(booking.cancelFreeUntil, zone) : null,
		price,
		feePercent,
		fee: price && feePercent ? round2((price * feePercent) / 100) : null
	};
	if (now >= start) return { status: 'past', ...terms };
	if (!booking.cancelFreeUntil || now < new Date(booking.cancelFreeUntil).getTime())
		return { status: 'free', ...terms };
	return { status: terms.fee ? 'fee' : 'contact', ...terms };
}

/** Cancellation link valid for this booking (bookings before the token accept the id alone) */
export const isValidCancelToken = (booking: BookingRecord, token: string | null) =>
	!booking.cancelToken || booking.cancelToken === token;

export const cancelLink = (
	origin: string,
	booking: Pick<BookingRecord, 'terminId' | 'cancelToken'>
) =>
	`${origin}/termin-stornieren?id=${encodeURIComponent(booking.terminId)}${
		booking.cancelToken ? `&t=${booking.cancelToken}` : ''
	}`;

const splitName = (name = '') => {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	return parts.length > 1
		? { vorname: parts.slice(0, -1).join(' '), nachname: parts[parts.length - 1] }
		: { vorname: parts[0] ?? '', nachname: '' };
};

/**
 * Cancels a booking: frees the slot, voids its open invoice, issues the fee invoice
 * (status «fee») and informs customer + provider. Returns the fee invoice number.
 */
export async function cancelBooking(
	booking: BookingRecord,
	terms: CancelTerms
): Promise<{ feeInvoiceNumber: string | null }> {
	await deleteBooking(booking.terminId);
	invalidateTermineCache();

	const dateLabel = formatDateWithWeekday(booking.datum, booking.uhrzeit || null, 'de-CH', 'long');
	const notes: string[] = [];

	// Invoice of the booking: open → «storniert»; already paid → provider checks the refund
	let paidInvoice = false;
	if (booking.invoiceNumber) {
		try {
			const invoice = (await listManualInvoices()).find(
				(inv) => inv.invoiceNumber === booking.invoiceNumber
			);
			if (invoice?.paymentStatus === 'offen') {
				await updateManualInvoice(invoice.id, {
					paymentStatus: 'storniert',
					notes: [invoice.notes, `Termin storniert am ${new Date().toLocaleDateString('de-CH')}`]
						.filter(Boolean)
						.join('\n')
				});
			} else if (invoice?.paymentStatus === 'bezahlt') {
				paidInvoice = true;
				notes.push(
					`Die Rechnung ${invoice.invoiceNumber} ist bereits bezahlt — Rückerstattung prüfen${
						terms.status === 'fee' ? ' (abzüglich Stornogebühr)' : ''
					}.`
				);
			}
		} catch (e) {
			console.error('Rechnung zur Buchung nicht aktualisiert:', e);
		}
	}

	// Fee invoice incl. QR bill
	let feeInvoiceNumber: string | null = null;
	if (terms.status === 'fee' && terms.fee) {
		try {
			const settings = await loadInvoiceSettings();
			const fee = await createInvoice({
				source: 'terminbuchung',
				relatedId: booking.terminId,
				recipient: { ...splitName(booking.name), email: booking.email, tel: booking.telefon },
				items: [
					{
						description: `Stornogebühr ${terms.feePercent}% – ${booking.titel}, ${dateLabel}`,
						quantity: 1,
						unitPrice: terms.fee
					}
				],
				notes: paidInvoice
					? `Mit der bereits bezahlten Rechnung ${booking.invoiceNumber} verrechenbar.`
					: undefined,
				settings
			});
			feeInvoiceNumber = fee.invoiceNumber;
			if (booking.email) {
				await sendInvoiceMail({
					id: fee.id,
					invoiceNumber: fee.invoiceNumber,
					pdf: fee.pdf,
					to: booking.email,
					subject: `Stornierung bestätigt: ${booking.titel}`,
					text: [
						`Guten Tag${booking.name ? ' ' + booking.name : ''}`,
						``,
						`Ihre Buchung wurde storniert.`,
						``,
						`Angebot: ${booking.titel}`,
						`Datum: ${dateLabel}`,
						``,
						`Da die kostenlose Stornierungsfrist (bis ${terms.freeUntilLabel}) abgelaufen war, ` +
							`stellen wir Ihnen die Stornogebühr von ${terms.feePercent}% in Rechnung (siehe Anhang).`,
						``,
						`Freundliche Grüsse`,
						settings.name
					].join('\n')
				});
			}
		} catch (e) {
			console.error('Stornogebühr-Rechnung fehlgeschlagen:', e);
			notes.push('Die Rechnung für die Stornogebühr konnte nicht erstellt werden.');
		}
	}

	const resendKey = env.RESEND_API_KEY;
	const from = await getMailFrom();
	if (!resendKey || !from) return { feeInvoiceNumber };
	const { Resend } = await import('resend');
	const resend = new Resend(resendKey);

	// Confirmation without fee (with fee: sent together with the invoice above)
	if (booking.email && terms.status !== 'fee') {
		const { error } = await resend.emails.send({
			from,
			to: booking.email,
			subject: `Stornierung bestätigt: ${booking.titel}`,
			text: [
				`Guten Tag${booking.name ? ' ' + booking.name : ''}`,
				``,
				`Ihre Buchung wurde erfolgreich storniert.`,
				``,
				`Angebot: ${booking.titel}`,
				`Datum: ${dateLabel}`
			].join('\n')
		});
		if (error) console.error('Storno Kunden-E-Mail fehlgeschlagen:', error);
	}

	const notifyTo = await getNotifyTo();
	if (notifyTo) {
		const { error } = await resend.emails.send({
			from,
			to: notifyTo,
			subject: `Buchung storniert: ${booking.titel}`,
			text: [
				`Eine Buchung wurde storniert.`,
				``,
				`Angebot: ${booking.titel}`,
				`Datum: ${dateLabel}`,
				``,
				`Name: ${booking.name ?? '–'}`,
				...(booking.email ? [`E-Mail: ${booking.email}`] : []),
				...(feeInvoiceNumber
					? [``, `Stornogebühr ${terms.feePercent}%: Rechnung ${feeInvoiceNumber}`]
					: []),
				...(notes.length ? [``, ...notes] : []),
				``,
				`Der Termin ist wieder verfügbar.`
			].join('\n')
		});
		if (error) console.error('Storno Betreiber-E-Mail fehlgeschlagen:', error);
	}
	return { feeInvoiceNumber };
}
