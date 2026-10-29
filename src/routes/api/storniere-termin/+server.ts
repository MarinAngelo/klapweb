import type { RequestHandler } from '@sveltejs/kit';
import { deleteBooking, getBooking } from '$lib/server/bookings';
import { createClient } from '$lib/prismicio';
import { formatDateWithWeekday } from '$lib/utils/formatDate';
import { invalidateTermineCache } from '$lib/server/termineCache';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const id = url.searchParams.get('id');
	if (!id) {
		return html(400, 'Buchungs-ID fehlt.');
	}

	const booking = await getBooking(id).catch(() => null);
	if (booking === null) {
		return html(
			500,
			'Die Buchung konnte nicht geprüft werden. Bitte versuchen Sie es später erneut.'
		);
	}
	if (!booking) {
		return html(200, 'Diese Buchung wurde bereits storniert oder existiert nicht mehr.');
	}

	// CMS-Daten für E-Mails laden
	let companyName = '';
	let companyEmail = '';
	let fromEmail = env.EMAIL_FROM_ADDRESS;
	try {
		const client = createClient({ fetch });
		const settings = await client.getSingle('settings').catch(() => null);
		if (settings) {
			const s = settings.data as any;
			companyName = (s.responsible_person_company as string) ?? '';
			companyEmail = (s.responsible_email as string) ?? (s.e_mail as string) ?? '';
			fromEmail = (s.booking_from_email as string) || fromEmail;
		}
	} catch {
		/* CMS nicht erreichbar */
	}

	await deleteBooking(id);
	invalidateTermineCache();

	// E-Mails senden (fire-and-forget)
	const resendKey = env.RESEND_API_KEY;
	if (resendKey && fromEmail) {
		const datumLabel = booking.datum
			? formatDateWithWeekday(booking.datum, booking.uhrzeit || null, 'de-CH', 'long')
			: '–';

		import('resend')
			.then(({ Resend }) => {
				const resend = new Resend(resendKey);

				// Bestätigung an Kunde
				if (booking.email) {
					resend.emails
						.send({
							from: fromEmail,
							to: booking.email,
							subject: `Stornierung bestätigt: ${booking.titel}`,
							text: [
								`Guten Tag${booking.name ? ' ' + booking.name : ''}`,
								``,
								`Ihre Buchung wurde erfolgreich storniert.`,
								``,
								`Angebot: ${booking.titel}`,
								`Datum: ${datumLabel}`,
								``,
								`Freundliche Grüsse`,
								companyName
							].join('\n')
						})
						.then(({ error: e }) => {
							if (e) console.error('Storno Kunden-E-Mail fehlgeschlagen:', e);
						});
				}

				// Info an Betreiber
				if (companyEmail) {
					resend.emails
						.send({
							from: fromEmail,
							to: companyEmail,
							subject: `Buchung storniert: ${booking.titel}`,
							text: [
								`Eine Buchung wurde storniert.`,
								``,
								`Angebot: ${booking.titel}`,
								`Datum: ${datumLabel}`,
								``,
								`Name: ${booking.name ?? '–'}`,
								...(booking.email ? [`E-Mail: ${booking.email}`] : []),
								``,
								`Der Termin ist wieder verfügbar.`
							].join('\n')
						})
						.then(({ error: e }) => {
							if (e) console.error('Storno Betreiber-E-Mail fehlgeschlagen:', e);
						});
				}
			})
			.catch((e) => console.error('Resend import fehlgeschlagen:', e));
	}

	return html(200, 'Ihre Buchung wurde erfolgreich storniert. Der Termin ist wieder verfügbar.');
};

function html(status: number, message: string) {
	return new Response(
		`<!doctype html><html><head><meta charset="utf-8"><title>Stornierung</title>
		<style>body{font-family:sans-serif;padding:2rem;max-width:480px;margin:0 auto;line-height:1.6;color:#222}</style>
		</head><body><p>${message}</p></body></html>`,
		{ status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
}
