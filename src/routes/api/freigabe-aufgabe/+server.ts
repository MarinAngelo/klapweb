/**
 * GET /api/freigabe-aufgabe?id=...&secret=...
 *
 * Bestätigt eine Aufgaben-Annahme und sendet die Bestätigungsmail an den Nutzer.
 * Link wird dem Betreiber per E-Mail zugestellt.
 */
import type { RequestHandler } from '@sveltejs/kit';
import { getAnnahme, updateAnnahme } from '$lib/server/aufgaben';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	const secret = url.searchParams.get('secret');
	const adminSecret = env.ADMIN_SECRET;

	if (!adminSecret || secret !== adminSecret) return html(403, 'Kein Zugriff');
	if (!id) return html(400, 'Annahme-ID fehlt');

	let annahme;
	try {
		annahme = await getAnnahme(id);
	} catch (e) {
		return html(500, `Fehler beim Laden: ${e}`);
	}

	if (!annahme) return html(404, 'Annahme nicht gefunden');
	if (annahme.status === 'annahme_bestaetigt' || annahme.status === 'erledigt') {
		return html(200, `Annahme von ${annahme.name} wurde bereits freigegeben.`);
	}

	try {
		await updateAnnahme(id, { status: 'annahme_bestaetigt', bestaetgtAt: new Date().toISOString() });
	} catch (e) {
		return html(500, `Fehler beim Freigeben: ${e}`);
	}

	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.INVOICE_FROM_EMAIL;

	if (resendKey && emailFrom && annahme.email) {
		import('resend').then(({ Resend }) => {
			const resend = new Resend(resendKey);
			resend.emails.send({
				from: emailFrom,
				to: annahme!.email!,
				subject: `Aufgabe bestätigt: ${annahme!.aufgabeTitel}`,
				text: [
					`Guten Tag ${annahme!.name}`,
					``,
					`Ihre Aufgabe wurde vom Betreiber bestätigt und kann nun erledigt werden.`,
					``,
					`Aufgabe: ${annahme!.aufgabeTitel}`,
					`Credits: ${annahme!.creditTyp === 'fest' ? `${annahme!.creditBetrag ?? 0} Credits (Fest)` : 'Zeitbasiert (Minuten × Preis/Nacht)'}`,
					``,
					`Bitte melden Sie sich nach Erledigung auf unserer Website an und geben Sie die Aufgabe ab.`,
					`Buchungs-ID: ${annahme!.buchungId}`,
					``,
					`Freundliche Grüsse`
				].join('\n')
			}).then(({ error: e }) => {
				if (e) console.error('Freigabe-Mail fehlgeschlagen:', e);
			});
		}).catch((e) => console.error('Resend import fehlgeschlagen:', e));
	}

	return html(200, `
		<strong>Aufgabe freigegeben ✓</strong><br><br>
		Nutzer: ${annahme.name} (${annahme.email ?? '–'})<br>
		Aufgabe: ${annahme.aufgabeTitel}<br>
		${annahme.email ? `Bestätigungsmail wurde an <strong>${annahme.email}</strong> gesendet.` : 'Keine E-Mail hinterlegt.'}
	`);
};

function html(status: number, body: string) {
	return new Response(
		`<!doctype html><html><head><meta charset="utf-8"><title>Aufgabe freigeben</title>
		<style>body{font-family:sans-serif;padding:2rem;max-width:600px;margin:0 auto;line-height:1.6}</style>
		</head><body>${body}</body></html>`,
		{ status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
}
