/**
 * GET /api/bestaetige-buchung?id=...&secret=...
 *
 * Bestätigt eine Buchungsanfrage und sendet die Bestätigungsmail an den Mieter.
 *
 * Tokens im CMS-Mailtext: {{Name}}, {{Ressource}}, {{RessourceUid}},
 *   {{Anreise}}, {{Abreise}}, {{Nächte}}, {{Personen}}, {{Zimmer}}, {{Total}}, {{Buchungsreferenz}}
 */
import type { RequestHandler } from '@sveltejs/kit';
import { getRessourceBuchung, updateRessourceBuchungStatus } from '$lib/server/ressourceBuchungen';
import { createClient } from '$lib/prismicio';
import * as prismic from '@prismicio/client';
import { maybeSendAnkunftsErinnerung } from '$lib/server/reminderMail';
import { env } from '$env/dynamic/private';

function replaceTokens(html: string, tokens: Record<string, string>): string {
	return html.replace(/\{\{([^}]+)\}\}/g, (_, key) => tokens[key] ?? '');
}

export const GET: RequestHandler = async ({ url, fetch }) => {
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
	const forceResend = url.searchParams.get('resend') === 'true';
	if (buchung.status === 'confirmed' && !forceResend) {
		return html(200, `Buchung von ${buchung.name ?? '–'} (${buchung.von} – ${buchung.bis}) wurde bereits bestätigt. <a href="?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret ?? '')}&resend=true">Bestätigungsmail erneut senden</a>`);
	}

	// Status auf confirmed setzen (nur wenn noch nicht bestätigt)
	if (buchung.status !== 'confirmed') {
		try {
			buchung = await updateRessourceBuchungStatus(id, 'confirmed');
		} catch (e) {
			return html(500, `Fehler beim Bestätigen: ${e}`);
		}
	}

	// Ankunftserinnerung sofort senden wenn Ankunft < 48h
	maybeSendAnkunftsErinnerung(buchung, fetch).catch(console.error);

	// ── Datums- und Preisformatierung ─────────────────────────────────────────
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

	const zimmerauswahl = buchung.zimmerauswahl ?? [];
	const zimmerHtml = zimmerauswahl.length
		? `<ul>${zimmerauswahl.map((z) => `<li>${z.zimmer_name || z.bett_typ} (${z.anzahl_betten}× ${z.bett_typ})</li>`).join('')}</ul>`
		: 'Ganze Wohnung';

	const tokenMap: Record<string, string> = {
		Name:             buchung.name ?? '',
		Ressource:        buchung.ressourceName ?? buchung.ressourceUid,
		RessourceUid:     buchung.ressourceUid,
		Anreise:          vonFormatted,
		Abreise:          bisFormatted,
		'Nächte':         String(naechte),
		Personen:         String(buchung.personen),
		Zimmer:           zimmerHtml,
		Total:            preisFormatted,
		Buchungsreferenz: buchung.referenz ?? buchung.id
	};

	// ── CMS-Template laden (immer, unabhängig von Mail-Env-Vars) ─────────────
	let betreff = `Buchungsbestätigung: ${buchung.ressourceName ?? buchung.ressourceUid}`;
	let mailHtml: string | null = null;
	let cmsDebug = '';

	try {
		const client = createClient({ fetch });
		const doc = await client.getByUID('ressource', buchung.ressourceUid);
		const d = doc.data as any;

		const cmsBetreff = (d.buchungsbestaetigung_betreff as string)?.trim();
		if (cmsBetreff) betreff = replaceTokens(cmsBetreff, tokenMap);

		const cmsTextField = d.buchungsbestaetigung_text as prismic.RichTextField | undefined;
		cmsDebug = `Prismic OK — uid=${buchung.ressourceUid}, betreff="${cmsBetreff ?? '(leer)'}", text.length=${cmsTextField?.length ?? 0}`;
		if (cmsTextField?.length) {
			mailHtml = replaceTokens(prismic.asHTML(cmsTextField) ?? '', tokenMap);
		}
	} catch (err) {
		cmsDebug = `Prismic Fehler: ${err}`;
	}

	// ── Mail senden ───────────────────────────────────────────────────────────
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.INVOICE_FROM_EMAIL;
	let mailGesendet = false;
	let mailFehler = '';

	if (resendKey && emailFrom && buchung.email) {
		if (mailHtml) {
			try {
				const { Resend } = await import('resend');
				const { error: e } = await new Resend(resendKey).emails.send({
					from: emailFrom,
					to: buchung.email,
					subject: betreff,
					html: mailHtml
				});
				if (e) { mailFehler = JSON.stringify(e); }
				else { mailGesendet = true; }
			} catch (e) {
				mailFehler = String(e);
			}
		} else {
			// Fallback: plain text
			const zimmerZeilen = zimmerauswahl.map(
				(z) => `           · ${z.zimmer_name || z.bett_typ} (${z.anzahl_betten}× ${z.bett_typ})`
			);
			const plainText = [
				`Guten Tag ${buchung.name}`,
				``,
				`Ihre Buchungsanfrage wurde bestätigt.`,
				``,
				`Ressource: ${buchung.ressourceName ?? buchung.ressourceUid} (${buchung.ressourceUid})`,
				`Anreise:   ${vonFormatted}`,
				`Abreise:   ${bisFormatted}`,
				`Nächte:    ${naechte}`,
				`Personen:  ${buchung.personen}`,
				...(zimmerZeilen.length ? [`Zimmer:`, ...zimmerZeilen] : [`Zimmer:    Ganze Wohnung`]),
				`Total:     ${preisFormatted}`,
				``,
				`Ihre Buchungsreferenz:`,
				``,
				`${buchung.referenz ?? buchung.id}`,
				`(Diese benötigen Sie für den Check-in und Check-out auf unserer Website.)`,
				``,
				`Wir melden uns in Kürze zur Zahlungsabwicklung.`,
				``,
				`Freundliche Grüsse`
			].join('\n');

			try {
				const { Resend } = await import('resend');
				const { error: e } = await new Resend(resendKey).emails.send({
					from: emailFrom,
					to: buchung.email,
					subject: betreff,
					text: plainText
				});
				if (e) { mailFehler = JSON.stringify(e); }
				else { mailGesendet = true; }
			} catch (e) {
				mailFehler = String(e);
			}
		}
	}

	return html(200, `
		<strong>Buchung bestätigt ✓</strong><br><br>
		Mieter: ${buchung.name ?? '–'}<br>
		Zeitraum: ${buchung.von} – ${buchung.bis}<br>
		${!buchung.email
			? 'Keine E-Mail-Adresse hinterlegt.'
			: !resendKey || !emailFrom
				? '<em>Mail-Env-Vars nicht gesetzt (lokal) — kein Mail gesendet.</em>'
				: mailGesendet
					? `Bestätigungsmail wurde an <strong>${buchung.email}</strong> gesendet.`
					: `E-Mail fehlgeschlagen: ${mailFehler || '–'}`
		}
		<p style="margin-top:1.5rem;font-size:0.8rem;color:#888;font-family:monospace;">CMS: ${cmsDebug}</p>
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
