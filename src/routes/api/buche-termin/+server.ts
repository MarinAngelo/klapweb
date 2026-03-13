import type { RequestHandler } from '@sveltejs/kit';
import { bookSlot, isBooked } from '$lib/server/bookings';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';

function fmtDate(datum: string, uhrzeit: string): string {
	if (!datum) return '–';
	const d = new Date(datum + 'T12:00:00Z');
	const formatted = d.toLocaleDateString('de-CH', {
		weekday: 'long',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: 'UTC'
	});
	return uhrzeit ? `${formatted}, ${uhrzeit} Uhr` : formatted;
}

function applyTokens(str: string, tokens: Record<string, string>): string {
	return str.replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? `{{${k}}}`);
}

function richTextToPlain(blocks: Array<{ text?: string }> | null | undefined, tokens: Record<string, string>): string {
	if (!blocks?.length) return '';
	return blocks
		.filter((b) => b.text)
		.map((b) => applyTokens(b.text!, tokens))
		.join('\n\n');
}

export const POST: RequestHandler = async ({ request, fetch }) => {
	let body: { terminId?: string; name?: string; email?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Ungültige Anfrage' }), { status: 400 });
	}

	const { terminId, name, email } = body;
	if (!terminId) {
		return new Response(JSON.stringify({ error: 'terminId fehlt' }), { status: 400 });
	}

	// Check if already booked
	const alreadyBooked = await isBooked(terminId);
	if (alreadyBooked) {
		return new Response(
			JSON.stringify({ error: 'Dieser Termin ist leider nicht mehr verfügbar.' }),
			{ status: 409 }
		);
	}

	// Fetch termin + company info from Prismic
	let datum = '';
	let uhrzeit = '';
	let titel = terminId;
	let sessionLaenge: number | null = null;
	let companyName = '';
	let companyEmail = '';
	let bookingFromEmail = '';
	let custEmailSubject: string | null = null;
	let custEmailBody: Array<{ text?: string }> | null = null;

	try {
		const client = createClient({ fetch });
		const [doc, settings] = await Promise.all([
			client.getByUID('terminplanung', terminId),
			client.getSingle('settings').catch(() => null)
		]);

		const d = doc.data as any;
		datum = d.datum ?? '';
		uhrzeit = d.uhrzeit ?? '';
		titel = d.titel ?? terminId;
		sessionLaenge = d.session_laenge ?? null;

		if (settings) {
			const s = settings.data as any;
			companyName = (s.responsible_person_company as string) ?? '';
			companyEmail = (s.responsible_email as string) ?? (s.e_mail as string) ?? '';
			bookingFromEmail = (s.booking_from_email as string) ?? '';
			custEmailSubject = (s.booking_customer_email_subject as string) || null;
			custEmailBody = Array.isArray(s.booking_customer_email_body)
				? s.booking_customer_email_body
				: null;
		}
	} catch {
		return new Response(JSON.stringify({ error: 'Termin nicht gefunden' }), { status: 404 });
	}

	await bookSlot({
		terminId,
		datum,
		uhrzeit,
		titel,
		bookedAt: new Date().toISOString(),
		name,
		email
	});

	// Send emails (fire-and-forget — booking is already saved)
	const resendKey = env.RESEND_API_KEY;
	const fromEmail = bookingFromEmail || env.INVOICE_FROM_EMAIL;
	const toEmail = env.INVOICE_TO_EMAIL || companyEmail;

	if (resendKey && fromEmail && toEmail) {
		const dateLabel = fmtDate(datum, uhrzeit);
		const durationLine = sessionLaenge ? ` (${sessionLaenge} min)` : '';
		const terminLine = `${titel}${durationLine}\n${dateLabel}`;
		const customerName = name || 'Kunde/Kundin';

		const tokens: Record<string, string> = {
			Titel: titel,
			Datum: datum
				? new Date(datum + 'T12:00:00Z').toLocaleDateString('de-CH', {
						weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
					})
				: '–',
			Uhrzeit: uhrzeit || '–',
			Dauer: sessionLaenge ? `${sessionLaenge} min` : '–',
			Name: name || '',
			Firma: companyName
		};

		const subject = custEmailSubject
			? applyTokens(custEmailSubject, tokens)
			: `Terminbestätigung: ${titel}`;

		const bodyText = richTextToPlain(custEmailBody, tokens) || [
			`Guten Tag${name ? ' ' + name : ''}`,
			``,
			`Ihr Termin wurde erfolgreich gebucht.`,
			``,
			`Termin: ${terminLine}`,
			``,
			`Bei Fragen stehen wir Ihnen gerne zur Verfügung.`,
			``,
			`Freundliche Grüsse`,
			companyName
		].join('\n');

		import('resend').then(({ Resend }) => {
			const resend = new Resend(resendKey);

			// E-Mail an Kunden
			if (email) {
				resend.emails.send({
					from: fromEmail,
					to: email,
					subject,
					text: bodyText
				}).then(({ error: e }) => {
					if (e) console.error('Buchung Kunden-E-Mail fehlgeschlagen:', e);
				});
			}

			// Benachrichtigung an Anbieter
			resend.emails.send({
				from: fromEmail,
				to: toEmail,
				subject: `Neue Buchung: ${titel}`,
				text: [
					`Neue Buchung eingegangen.`,
					``,
					`Termin: ${terminLine}`,
					`Kunde: ${customerName}${email ? ' <' + email + '>' : ''}`
				].join('\n')
			}).then(({ error: e }) => {
				if (e) console.error('Buchung Anbieter-E-Mail fehlgeschlagen:', e);
			});
		}).catch((e) => console.error('Resend import fehlgeschlagen:', e));
	} else {
		console.warn('Resend-Konfiguration fehlt (RESEND_API_KEY / INVOICE_FROM_EMAIL / INVOICE_TO_EMAIL) — keine Buchungs-E-Mails gesendet');
	}

	return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
