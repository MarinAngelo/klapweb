import { json } from '@sveltejs/kit';
import { checkInBuchung } from '$lib/server/ressourceBuchungen';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
	const { referenz, items } = await request.json();
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
	const toEmail = env.INVOICE_TO_EMAIL;
	const emailFrom = env.INVOICE_FROM_EMAIL;
	if (resendKey && toEmail && emailFrom && buchung) {
		const [vonY, vonM, vonD] = buchung.von.split('-');
		const [bisY, bisM, bisD] = buchung.bis.split('-');
		try {
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);
			await resend.emails.send({
				from: emailFrom,
				to: toEmail,
				subject: `Check-in: ${buchung.ressourceName ?? buchung.ressourceUid}`,
				text: [
					`${buchung.name ?? '–'} hat eingecheckt.`,
					``,
					`Ressource: ${buchung.ressourceName ?? buchung.ressourceUid}`,
					`Anreise:   ${vonD}.${vonM}.${vonY}`,
					`Abreise:   ${bisD}.${bisM}.${bisY}`,
					`Personen:  ${buchung.personen}`,
					...(items?.length ? [``, `Checkliste:`, ...items.map((i: string) => `  · ${i}`)] : [])
				].join('\n')
			});
		} catch (e) {
			console.error('Check-in E-Mail Fehler:', e);
		}
	}

	return json({ success: true });
}
