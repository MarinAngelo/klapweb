/**
 * GET /api/bestaetige-buchung?id=...&secret=...
 *
 * Bestätigt eine Buchungsanfrage und sendet die Bestätigungsmail an den Mieter.
 * Der Link wird vom Vermieter per E-Mail erhalten.
 */
import type { RequestHandler } from '@sveltejs/kit';
import { getRessourceBuchung, updateRessourceBuchungStatus } from '$lib/server/ressourceBuchungen';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	const secret = url.searchParams.get('secret');
	const adminSecret = env.ADMIN_SECRET;

	if (!adminSecret || secret !== adminSecret) {
		return html(403, 'Kein Zugriff');
	}
	if (!id) {
		return html(400, 'Buchungs-ID fehlt');
	}

	let buchung;
	try {
		buchung = await getRessourceBuchung(id);
	} catch (e) {
		return html(500, `Fehler beim Laden der Buchung: ${e}`);
	}

	if (!buchung) {
		return html(404, 'Buchung nicht gefunden');
	}
	if (buchung.status === 'confirmed') {
		return html(200, `Buchung von ${buchung.name ?? '–'} (${buchung.von} – ${buchung.bis}) wurde bereits bestätigt.`);
	}

	// Status auf confirmed setzen
	try {
		await updateRessourceBuchungStatus(id, 'confirmed');
	} catch (e) {
		return html(500, `Fehler beim Bestätigen: ${e}`);
	}

	// Bestätigungsmail an Mieter senden
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.INVOICE_FROM_EMAIL;

	if (resendKey && emailFrom && buchung.email) {
		const vonFormatted = new Date(buchung.von + 'T12:00:00Z').toLocaleDateString('de-CH', {
			weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
		});
		const bisFormatted = new Date(buchung.bis + 'T12:00:00Z').toLocaleDateString('de-CH', {
			weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
		});
		const naechte = Math.round(
			(new Date(buchung.bis).getTime() - new Date(buchung.von).getTime()) / 86400000
		);
		const preisFormatted = new Intl.NumberFormat('de-CH', {
			style: 'currency', currency: 'CHF'
		}).format(buchung.preisCHF);

		const zimmerZeilen = (buchung.zimmerauswahl ?? []).map(
			(z) => `           · ${z.zimmer_name || z.bett_typ} (${z.anzahl_betten}× ${z.bett_typ})`
		);
		const buchungsDetails = [
			`Ressource: ${buchung.ressourceName ?? buchung.ressourceUid}`,
			`Anreise:   ${vonFormatted}`,
			`Abreise:   ${bisFormatted}`,
			`Nächte:    ${naechte}`,
			`Personen:  ${buchung.personen}`,
			...(zimmerZeilen.length ? [`Zimmer:`, ...zimmerZeilen] : []),
			`Total:     ${preisFormatted}`
		].join('\n');

		import('resend').then(({ Resend }) => {
			const resend = new Resend(resendKey);
			resend.emails.send({
				from: emailFrom,
				to: buchung!.email!,
				subject: `Buchungsbestätigung: ${buchung!.ressourceName ?? buchung!.ressourceUid}`,
				text: [
					`Guten Tag ${buchung!.name}`,
					``,
					`Ihre Buchungsanfrage wurde bestätigt.`,
					``,
					buchungsDetails,
					``,
					`Wir melden uns in Kürze zur Zahlungsabwicklung.`,
					``,
					`Freundliche Grüsse`
				].join('\n')
			}).then(({ error: e }) => {
				if (e) console.error('Bestätigung Kunden-E-Mail fehlgeschlagen:', e);
			});
		}).catch((e) => console.error('Resend import fehlgeschlagen:', e));
	}

	return html(200, `
		<strong>Buchung bestätigt ✓</strong><br><br>
		Mieter: ${buchung.name ?? '–'}<br>
		Zeitraum: ${buchung.von} – ${buchung.bis}<br>
		${buchung.email ? `Bestätigungsmail wurde an <strong>${buchung.email}</strong> gesendet.` : 'Keine E-Mail-Adresse hinterlegt.'}
	`);
};

function html(status: number, body: string) {
	return new Response(
		`<!doctype html><html><head><meta charset="utf-8"><title>Buchung bestätigen</title>
		<style>body{font-family:sans-serif;padding:2rem;max-width:600px;margin:0 auto;line-height:1.6}</style>
		</head><body>${body}</body></html>`,
		{ status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
}
