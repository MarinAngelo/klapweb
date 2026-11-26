import { json } from '@sveltejs/kit';
import { checkInBuchung } from '$lib/server/ressourceBuchungen';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';
import { getMailFrom, getNotifyTo } from '$lib/server/mailFrom';
import { checkInMail } from '$lib/server/ressourceMail';

export async function POST({ request, fetch }) {
	const { referenz, items, kommentar } = await request.json();
	if (!referenz?.trim()) return json({ error: 'Buchungsreferenz fehlt.' }, { status: 400 });

	let buchung;
	try {
		buchung = await checkInBuchung(referenz.trim(), items ?? []);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'NOT_FOUND') return json({ error: 'NOT_FOUND' }, { status: 404 });
		if (msg === 'ALREADY_DONE') return json({ error: 'ALREADY_DONE' }, { status: 409 });
		return json({ error: 'SERVER_ERROR' }, { status: 500 });
	}

	// E-Mail an Betreiber
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = await getMailFrom();
	let toEmail = await getNotifyTo(fetch);
	if (!toEmail) {
		try {
			const client = createClient({ fetch });
			const settings = await client.getSingle('settings');
			const s = settings.data as any;
			toEmail = (s.responsible_email as string) || (s.e_mail as string) || '';
		} catch {
			/* ignore */
		}
	}
	if (resendKey && toEmail && emailFrom && buchung) {
		try {
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);
			await resend.emails.send({
				from: emailFrom,
				to: toEmail,
				...checkInMail({ ...buchung, items, kommentar })
			});
		} catch (e) {
			console.error('Check-in E-Mail Fehler:', e);
		}
	}

	return json({ success: true });
}
