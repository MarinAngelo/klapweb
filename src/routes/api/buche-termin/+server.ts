import type { RequestHandler } from '@sveltejs/kit';
import { bookSlot, hasOverlappingBooking, isBooked, isCancelled } from '$lib/server/bookings';
import { cancelDeadline, cancelLink, formatDeadline } from '$lib/server/bookingCancel';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';
import { formatDateWithWeekday, SITE_TIME_ZONE, zonedTimeToUtc } from '$lib/utils/formatDate';
import { loadOfferLocation } from '$lib/server/bookingLocation';
import { expandArbeitstag } from '$lib/server/terminSlots';
import { loadAllWorkdays } from '$lib/server/adminSlots';
import { invalidateTermineCache } from '$lib/server/termineCache';
import { getMailFrom } from '$lib/server/mailFrom';
import { isAdmin } from '$lib/server/adminAuth';
import { confirmationMail, providerBookingMail } from '$lib/server/bookingMails';
import { textStyleFrom } from '$lib/addressForm';
import { loadMailTheme, type MailTheme } from '$lib/mailLayout.js';

function buildDatetimeStr(datum: string, uhrzeit: string): string {
	// Returns floating local datetime string: YYYYMMDDTHHMMSS
	const base = datum.replace(/-/g, '');
	if (!uhrzeit) return base; // all-day fallback
	const time = uhrzeit.replace(':', '') + '00';
	return `${base}T${time}`;
}

function addMinutes(datum: string, uhrzeit: string, minutes: number): string {
	const [h, m] = uhrzeit.split(':').map(Number);
	const total = h * 60 + m + minutes;
	const eh = Math.floor(total / 60) % 24;
	const em = total % 60;
	const time = `${String(eh).padStart(2, '0')}${String(em).padStart(2, '0')}00`;
	return `${datum.replace(/-/g, '')}T${time}`;
}

function generateICS(
	terminId: string,
	titel: string,
	datum: string,
	uhrzeit: string,
	sessionLaenge: number | null
): string {
	if (!datum) return '';
	const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
	const uid = `${terminId}@klapweb`;

	let dtStart: string;
	let dtEnd: string;
	if (uhrzeit) {
		dtStart = `DTSTART:${buildDatetimeStr(datum, uhrzeit)}`;
		dtEnd = `DTEND:${addMinutes(datum, uhrzeit, sessionLaenge ?? 60)}`;
	} else {
		const d = datum.replace(/-/g, '');
		dtStart = `DTSTART;VALUE=DATE:${d}`;
		dtEnd = `DTEND;VALUE=DATE:${d}`;
	}

	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//klapweb//Terminbuchung//DE',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${now}`,
		dtStart,
		dtEnd,
		`SUMMARY:${titel.replace(/[\\,;]/g, (c) => '\\' + c)}`,
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n');
}

function convertToTimezone(datum: string, uhrzeit: string, fromTz: string, toTz: string): string {
	if (!datum || !uhrzeit || fromTz === toTz) return '';
	const [y, mo, d] = datum.split('-').map(Number);
	const [h, mi] = uhrzeit.split(':').map(Number);
	const utcGuess = Date.UTC(y, mo - 1, d, h, mi);
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: fromTz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).formatToParts(new Date(utcGuess));
	const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? '0');
	const fromTzUtc = Date.UTC(
		get('year'),
		get('month') - 1,
		get('day'),
		get('hour') === 24 ? 0 : get('hour'),
		get('minute')
	);
	const actualUtc = utcGuess + (utcGuess - fromTzUtc);
	return (
		new Intl.DateTimeFormat('de-CH', {
			timeZone: toTz,
			weekday: 'long',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(actualUtc)) + ' Uhr'
	);
}

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
	let body: {
		terminId?: string;
		name?: string;
		email?: string;
		customerTimezone?: string;
		fields?: Record<string, string>;
		fieldLabels?: Record<string, string>;
		telefon?: string;
		/** Operator books for a customer (admin «Terminverwaltung»), requires admin session */
		byAdmin?: boolean;
		/** Admin booking: send the confirmation to the customer (only with e-mail) */
		sendConfirmation?: boolean;
	};
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Ungültige Anfrage' }), { status: 400 });
	}

	const { terminId, name, email, customerTimezone, fields, fieldLabels, telefon } = body;
	const origin = new URL(request.url).origin;
	if (!terminId) {
		return new Response(JSON.stringify({ error: 'terminId fehlt' }), { status: 400 });
	}
	// Source is decided by the server: «byAdmin» from the browser alone is not trusted
	const byAdmin = !!body.byAdmin;
	if (byAdmin && !isAdmin(cookies)) {
		return new Response(JSON.stringify({ error: 'Nicht angemeldet' }), { status: 403 });
	}

	// Check if already booked or cancelled
	const alreadyBooked = await isBooked(terminId);
	if (alreadyBooked) {
		return new Response(
			JSON.stringify({ error: 'Dieser Termin ist leider nicht mehr verfügbar.' }),
			{ status: 409 }
		);
	}

	const cancelled = await isCancelled(terminId);
	if (cancelled) {
		return new Response(
			JSON.stringify({ error: 'Dieser Termin ist leider nicht mehr verfügbar.' }),
			{ status: 409 }
		);
	}

	// Fetch termin + company info from Prismic
	let datum = '';
	let uhrzeit = '';
	let endzeit = '';
	let blockedUntil = '';
	let vorlaufzeit = 0;
	let titel = terminId;
	let sessionLaenge: number | null = null;
	let zeitzone = 'Europe/Zurich';
	let arbeitstagId: string | undefined;
	let angebotId: string | undefined;
	let ortName = '';
	let ortAdresse = '';
	let ortWegbeschreibung = '';
	let ortTelefon = '';
	let ortKarte = '';
	let companyName = '';
	let companyEmail = '';
	let custEmailSubject: string | null = null;
	let custEmailBody: Array<{ text?: string }> | null = null;
	// Invoice for offers with «Preis» (setting «Rechnung bei Buchung senden»)
	let settingsData: Record<string, unknown> = {};
	let offerPrice: number | null = null;
	// Cancellation terms: offer, otherwise default of the settings
	let cancelHours: number | null = null;
	let cancelFeePercent: number | null = null;
	// Page colours for the HTML confirmation
	let mailTheme: MailTheme | null = null;

	try {
		const client = createClient({ fetch });
		const dynamicClient = client as any;
		const settings = await client.getSingle('settings').catch(() => null);
		if (settings) {
			const s = settings.data as any;
			settingsData = s;
			companyName = (s.responsible_person_company as string) ?? '';
			companyEmail = (s.responsible_email as string) ?? (s.e_mail as string) ?? '';
			custEmailSubject = (s.booking_customer_email_subject as string) || null;
			custEmailBody = Array.isArray(s.booking_customer_email_body)
				? s.booking_customer_email_body
				: null;
		}

		const [{ workdays, offers }, theme] = await Promise.all([
			loadAllWorkdays(dynamicClient),
			loadMailTheme(client).catch(() => null)
		]);
		mailTheme = theme;
		const today = new Date().toISOString().slice(0, 10);
		const slot = workdays
			.flatMap((doc: any) => expandArbeitstag(doc, offers, today))
			.find((item) => item.id === terminId);
		if (!slot) throw new Error('Termin nicht gefunden');
		datum = slot.datum;
		uhrzeit = slot.uhrzeit;
		endzeit = slot.endzeit ?? '';
		blockedUntil = slot.blockedUntil ?? endzeit;
		vorlaufzeit = slot.vorlaufzeit ?? 0;
		titel = slot.titel;
		sessionLaenge = slot.sessionLaenge;
		zeitzone = slot.zeitzone;
		arbeitstagId = slot.arbeitstagId;
		angebotId = slot.angebotId;

		// Ort aus dem verknüpften Angebot laden
		const offerDoc = offers.find((o: any) => o.uid === slot.angebotId);
		const price = Number((offerDoc?.data as any)?.preis);
		offerPrice = price > 0 ? price : null;
		const positive = (value: unknown) => (Number(value) > 0 ? Number(value) : null);
		const od = (offerDoc?.data ?? {}) as any;
		cancelHours =
			positive(od.cancel_free_hours) ?? positive(settingsData.booking_cancel_free_hours);
		cancelFeePercent =
			positive(od.cancel_fee_percent) ?? positive(settingsData.booking_cancel_fee_percent);
		({ ortName, ortAdresse, ortWegbeschreibung, ortTelefon, ortKarte } = await loadOfferLocation(
			dynamicClient,
			offerDoc,
			fetch
		));
	} catch {
		return new Response(JSON.stringify({ error: 'Termin nicht gefunden' }), { status: 404 });
	}

	// Lead time («Vorlaufzeit») also when submitting: the slot list may have been loaded earlier.
	// The operator may book at short notice (no lead time), but not in the past
	if (
		datum &&
		uhrzeit &&
		zonedTimeToUtc(datum, uhrzeit, zeitzone || SITE_TIME_ZONE) -
			(byAdmin ? 0 : vorlaufzeit) * 60000 <
			Date.now()
	) {
		return new Response(
			JSON.stringify({ error: 'Dieser Termin ist leider nicht mehr verfügbar.' }),
			{ status: 409 }
		);
	}

	// Incl. buffer on both sides (Puffer danach)
	if (blockedUntil && (await hasOverlappingBooking(datum, uhrzeit, blockedUntil, terminId))) {
		return new Response(
			JSON.stringify({ error: 'Dieser Termin ist leider nicht mehr verfügbar.' }),
			{ status: 409 }
		);
	}

	const cancelFreeUntil = cancelDeadline(datum, uhrzeit, zeitzone, cancelHours);
	const cancelToken = crypto.randomUUID().replace(/-/g, '');
	const stornoLink = cancelLink(origin, { terminId, cancelToken });
	// «Kostenlos stornierbar bis …» for the e-mail ({{Stornofrist}}); '' = no deadline
	const stornoFrist = cancelFreeUntil ? formatDeadline(cancelFreeUntil, zeitzone) : '';

	await bookSlot({
		terminId,
		datum,
		uhrzeit,
		endzeit,
		blockedUntil,
		titel,
		bookedAt: new Date().toISOString(),
		name,
		email,
		telefon: telefon?.trim() || undefined,
		price: offerPrice ?? undefined,
		cancelFreeUntil,
		cancelFeePercent: cancelFreeUntil ? (cancelFeePercent ?? undefined) : undefined,
		cancelToken,
		zeitzone,
		// Invoice after the appointment (src/lib/server/bookingInvoices.ts, scheduled)
		invoicePending: settingsData.booking_invoice === true && !!offerPrice ? true : undefined,
		invoiceAddress:
			fields?.adresse || fields?.plz || fields?.ort
				? { adresse: fields.adresse, plz: fields.plz, ort: fields.ort, land: fields.land }
				: undefined,
		arbeitstagId,
		angebotId,
		source: byAdmin ? 'admin' : 'online'
	});
	invalidateTermineCache();

	// Kunde erfassen (mit Duplikat-Prüfung per E-Mail)
	if (email) {
		try {
			const { saveCustomer, listCustomers } = await import('$lib/server/customers');
			const emailLower = email.trim().toLowerCase();
			const existing = await listCustomers();
			const isDuplicate = existing.some((c) => c.email && c.email.toLowerCase() === emailLower);
			if (!isDuplicate) {
				const nameParts = (name ?? '').trim().split(/\s+/);
				await saveCustomer({
					date: new Date().toISOString(),
					paymentMethod: 'terminbuchung',
					service: titel,
					amount: null,
					currency: 'CHF',
					vorname: nameParts.slice(0, -1).join(' ') || nameParts[0] || undefined,
					nachname: nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined,
					email
				});
			}
		} catch (e) {
			console.error('Kunde konnte nicht gespeichert werden:', e);
		}
	}

	// Send emails (fire-and-forget — booking is already saved)
	const resendKey = env.RESEND_API_KEY;
	const fromEmail = await getMailFrom();
	const toEmail = companyEmail;

	const icsDownloadLink = `${origin}/api/termin-ics?id=${encodeURIComponent(terminId)}`;

	if (resendKey && fromEmail && toEmail) {
		const datumLabel = datum ? formatDateWithWeekday(datum, null, 'de-CH', 'long') : '';
		const confirmation = confirmationMail({
			titel,
			datumLabel,
			uhrzeit,
			sessionLaenge,
			name,
			companyName,
			ortName,
			ortAdresse,
			ortWegbeschreibung,
			ortTelefon,
			ortKarte,
			stornoFrist,
			cancelFeePercent,
			offerPrice,
			customSubject: custEmailSubject,
			customBody: custEmailBody,
			customerTimezone,
			convertedTime: customerTimezone
				? convertToTimezone(datum, uhrzeit, zeitzone, customerTimezone)
				: '',
			icsLink: icsDownloadLink,
			stornoLink,
			theme: mailTheme,
			style: textStyleFrom(settingsData)
		});

		const icsContent = generateICS(terminId, titel, datum, uhrzeit, sessionLaenge);
		const icsAttachment = icsContent
			? [{ filename: 'termin.ics', content: Buffer.from(icsContent).toString('base64') }]
			: [];

		// Provider ICS includes customer name in title
		const providerTitel = name ? `${titel} – ${name}` : titel;
		const providerIcsContent = generateICS(terminId, providerTitel, datum, uhrzeit, sessionLaenge);
		const providerIcsAttachment = providerIcsContent
			? [{ filename: 'termin.ics', content: Buffer.from(providerIcsContent).toString('base64') }]
			: [];

		import('resend')
			.then(({ Resend }) => {
				const resend = new Resend(resendKey);

				// E-Mail an Kunden (admin booking: only if requested)
				if (email && (!byAdmin || body.sendConfirmation)) {
					resend.emails
						.send({
							from: fromEmail,
							to: email,
							subject: confirmation.subject,
							text: confirmation.text,
							html: confirmation.html,
							attachments: icsAttachment
						})
						.then(({ error: e }) => {
							if (e) console.error('Buchung Kunden-E-Mail fehlgeschlagen:', e);
						});
				}

				// Benachrichtigung an Anbieter — not when the operator booked it themselves
				if (byAdmin) return;
				const extraLines =
					fields && fieldLabels
						? Object.entries(fields)
								.filter(
									([key, value]) =>
										!['termin', 'name', 'email', 'subject', 'form-name', 'bot-field'].includes(
											key
										) && value !== 'Ausgewählt'
								)
								.map(([key, value]) => {
									const label = fieldLabels[key] ?? key;
									return value ? `${label}: ${value}` : '';
								})
								.filter(Boolean)
						: [];

				const providerMail = providerBookingMail({
					titel,
					datumLabel,
					uhrzeit,
					endzeit,
					sessionLaenge,
					ortName,
					ortAdresse,
					name,
					email,
					extraLines
				});
				resend.emails
					.send({
						from: fromEmail,
						to: toEmail,
						subject: providerMail.subject,
						text: providerMail.text,
						attachments: providerIcsAttachment
					})
					.then(({ error: e }) => {
						if (e) console.error('Buchung Anbieter-E-Mail fehlgeschlagen:', e);
					});
			})
			.catch((e) => console.error('Resend import fehlgeschlagen:', e));
	} else {
		console.warn(
			'Resend-Konfiguration fehlt (RESEND_API_KEY / Absender-E-Mail in den Einstellungen) — keine Buchungs-E-Mails gesendet'
		);
	}

	return new Response(
		JSON.stringify({
			ok: true,
			titel,
			datum: datum ? formatDateWithWeekday(datum, null, 'de-CH', 'long') : '',
			uhrzeit: uhrzeit || '',
			endzeit: endzeit || '',
			dauer: sessionLaenge ?? '',
			name: name || '',
			email: email || '',
			storno: stornoLink,
			ics: icsDownloadLink,
			ort: ortAdresse || ortName,
			karte: ortKarte
		}),
		{ status: 200 }
	);
};
