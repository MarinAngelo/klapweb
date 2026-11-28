/**
 * Reminder e-mails of appointment bookings — X hours before the appointment
 * (setting «Erinnerung: Stunden vor Termin», `booking_reminder_hours`; empty/0 = none).
 *
 * Same text as the confirmation (reminderMail in bookingMails.ts), with location, cancellation
 * terms, calendar and cancel link. Called hourly by netlify/functions/termin-erinnerungen.ts
 * (→ /api/cron/termin-erinnerungen).
 */
import { env } from '$env/dynamic/private';
import { listBookings, updateBooking, type BookingRecord } from '$lib/server/bookings';
import { cancelLink, formatDeadline } from '$lib/server/bookingCancel';
import { loadOfferLocation, type OfferLocation } from '$lib/server/bookingLocation';
import { reminderMail, reminderSentProviderMail } from '$lib/server/bookingMails';
import { getMailFrom, getNotifyTo } from '$lib/server/mailFrom';
import { textStyleFrom } from '$lib/addressForm';
import { createClient } from '$lib/prismicio';
import { loadMailTheme } from '$lib/mailLayout.js';
import { formatDateWithWeekday, SITE_TIME_ZONE, zonedTimeToUtc } from '$lib/utils/formatDate';

const start = (b: BookingRecord) =>
	zonedTimeToUtc(b.datum, b.uhrzeit, b.zeitzone || SITE_TIME_ZONE);

/** Minutes between start and end time («10:00»–«11:00» → 60); null without end time */
function duration(b: BookingRecord): number | null {
	if (!b.uhrzeit || !b.endzeit) return null;
	const min = (t: string) => {
		const [h, m] = t.split(':').map(Number);
		return h * 60 + m;
	};
	const d = min(b.endzeit) - min(b.uhrzeit);
	return d > 0 ? d : null;
}

/** Sends all due reminders; returns the booking ids reminded */
export async function sendDueBookingReminders(origin: string, now = Date.now()): Promise<string[]> {
	const client = createClient();
	const dynamicClient = client as any;
	const settings = await client.getSingle('settings').catch(() => null);
	const s = (settings?.data ?? {}) as Record<string, any>;
	const hours = Number(s.booking_reminder_hours ?? 0);
	if (!(hours > 0)) return [];

	const due = (await listBookings()).filter((b) => {
		if (!b.email || b.reminderSent || !b.datum || !b.uhrzeit) return false;
		const window = hours * 3600000;
		// Booked at short notice (less than X hours ahead): the confirmation suffices
		if (b.bookedAt && start(b) - Date.parse(b.bookedAt) < window) return false;
		const diff = start(b) - now;
		return diff > 0 && diff <= window;
	});
	if (!due.length) return [];

	const resendKey = env.RESEND_API_KEY;
	const from = await getMailFrom();
	if (!resendKey || !from) {
		console.warn('Termin-Erinnerungen: RESEND_API_KEY oder Absender-E-Mail fehlt');
		return [];
	}
	const { Resend } = await import('resend');
	const resend = new Resend(resendKey);

	const [offers, theme, notifyTo] = await Promise.all([
		dynamicClient.getAllByType('angebot').catch(() => []),
		loadMailTheme(client).catch(() => null),
		getNotifyTo()
	]);
	const style = textStyleFrom(s);
	const companyName = (s.responsible_person_company as string) ?? '';
	const locations = new Map<string, Promise<OfferLocation>>();
	const locationOf = (angebotId = '') => {
		if (!locations.has(angebotId)) {
			const offer = offers.find((o: any) => o.uid === angebotId);
			locations.set(angebotId, loadOfferLocation(dynamicClient, offer));
		}
		return locations.get(angebotId)!;
	};

	const sent: string[] = [];
	for (const booking of due) {
		// Claim first: a parallel run must not remind twice
		await updateBooking(booking.terminId, { reminderSent: true });
		try {
			const zone = booking.zeitzone || SITE_TIME_ZONE;
			// Cancellation deadline only while it lies ahead (the cancel page shows the current terms)
			const freeUntil =
				booking.cancelFreeUntil && Date.parse(booking.cancelFreeUntil) > now
					? booking.cancelFreeUntil
					: '';
			const mail = reminderMail({
				titel: booking.titel,
				datumLabel: formatDateWithWeekday(booking.datum, null, 'de-CH', 'long'),
				uhrzeit: booking.uhrzeit,
				sessionLaenge: duration(booking),
				name: booking.name,
				companyName,
				...(await locationOf(booking.angebotId)),
				stornoFrist: freeUntil ? formatDeadline(freeUntil, zone) : '',
				cancelFeePercent: booking.cancelFeePercent ?? null,
				offerPrice: booking.price ?? null,
				icsLink: `${origin}/api/termin-ics?id=${encodeURIComponent(booking.terminId)}`,
				stornoLink: cancelLink(origin, booking),
				theme,
				style
			});
			const { error } = await resend.emails.send({ from, to: booking.email!, ...mail });
			if (error) throw error;
			sent.push(booking.terminId);

			// Info to the operator — failure must not trigger a second reminder
			if (notifyTo) {
				await resend.emails
					.send({
						from,
						to: notifyTo,
						...reminderSentProviderMail({
							titel: booking.titel,
							dateLabel: `${formatDateWithWeekday(booking.datum, null, 'de-CH', 'long')}, ${booking.uhrzeit} Uhr`,
							name: booking.name,
							email: booking.email!,
							subject: mail.subject
						})
					})
					.catch((e) => console.error('Info zur Termin-Erinnerung fehlgeschlagen:', e));
			}
		} catch (e) {
			console.error(`Termin-Erinnerung ${booking.terminId} fehlgeschlagen:`, e);
			// Next run tries again
			await updateBooking(booking.terminId, { reminderSent: false }).catch(() => {});
		}
	}
	return sent;
}
