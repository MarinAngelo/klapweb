/**
 * GET /api/bestaetige-buchung?id=...&token=...  (token = adminActionToken('bestaetige-buchung', id))
 *
 * Bestätigt eine Buchungsanfrage und sendet die Bestätigungsmail an den Mieter.
 *
 * Tokens im CMS-Mailtext: {{Name}}, {{Ressource}}, {{RessourceUid}},
 *   {{Anreise}}, {{Abreise}}, {{Nächte}}, {{Personen}}, {{Zimmer}}, {{Total}}, {{Buchungsreferenz}}
 */
import type { RequestHandler } from '@sveltejs/kit';
import {
	loadVariablesData,
	mailVariables,
	renderMailHtml,
	renderMailText
} from '$lib/variables.js';
import { getRessourceBuchung, updateRessourceBuchungStatus } from '$lib/server/ressourceBuchungen';
import { createClient } from '$lib/prismicio';
import * as prismic from '@prismicio/client';
import { maybeSendAnkunftsErinnerung } from '$lib/server/reminderMail';
import { env } from '$env/dynamic/private';
import { adminActionToken, isAuthorizedAdminAction } from '$lib/server/adminAuth';
import {
	bestaetigungFallbackText,
	bestaetigungTokens,
	fallbackSubject,
	getRessourceDocForBooking
} from '$lib/server/ressourceMail';

export const GET: RequestHandler = async ({ url, fetch, cookies }) => {
	const id = url.searchParams.get('id');
	if (!isAuthorizedAdminAction('bestaetige-buchung', id ?? '', url, cookies)) {
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
		return html(
			200,
			`Buchung von ${buchung.name ?? '–'} (${buchung.von} – ${buchung.bis}) wurde bereits bestätigt. <a href="?id=${encodeURIComponent(id)}&token=${adminActionToken('bestaetige-buchung', id)}&resend=true">Bestätigungsmail erneut senden</a>`
		);
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
	await maybeSendAnkunftsErinnerung(buchung, fetch).catch(console.error);

	// ── CMS-Template in der Buchungssprache laden (Fallback: Hauptsprache) ───
	let ressourceName: string | undefined;
	let mailHtml: string | null = null;
	let cmsBetreff = '';
	// Variablen (incl. multi-line text) in the booking language, replaced before the booking tokens
	let vars: ReturnType<typeof mailVariables> = {};
	let cmsTextField: prismic.RichTextField | undefined;
	let cmsDebug = '';

	try {
		const client = createClient({ fetch });
		const [doc, variablesData] = await Promise.all([
			getRessourceDocForBooking(client, buchung),
			loadVariablesData(client)
		]);
		vars = mailVariables(variablesData, buchung.lang);
		const d = doc.data as any;
		ressourceName = d.name;
		cmsBetreff = (d.buchungsbestaetigung_betreff as string)?.trim() ?? '';
		cmsTextField = d.buchungsbestaetigung_text as prismic.RichTextField | undefined;
		cmsDebug = `Prismic OK — uid=${buchung.ressourceUid}, lang=${doc.lang}, betreff="${cmsBetreff || '(leer)'}", text.length=${cmsTextField?.length ?? 0}`;
	} catch (err) {
		cmsDebug = `Prismic Fehler: ${err}`;
	}

	const tokenMap = bestaetigungTokens(buchung, ressourceName);
	const betreff = cmsBetreff
		? renderMailText(cmsBetreff, tokenMap, vars)
		: fallbackSubject('Buchungsbestätigung: {ressource}', buchung, ressourceName);
	if (cmsTextField?.length) {
		mailHtml = renderMailHtml(prismic.asHTML(cmsTextField) ?? '', tokenMap, vars);
	}

	// ── Mail senden ───────────────────────────────────────────────────────────
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.EMAIL_FROM_ADDRESS;
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
				if (e) {
					mailFehler = JSON.stringify(e);
				} else {
					mailGesendet = true;
				}
			} catch (e) {
				mailFehler = String(e);
			}
		} else {
			// Fallback: plain text
			const plainText = bestaetigungFallbackText(buchung, tokenMap);

			try {
				const { Resend } = await import('resend');
				const { error: e } = await new Resend(resendKey).emails.send({
					from: emailFrom,
					to: buchung.email,
					subject: betreff,
					text: plainText
				});
				if (e) {
					mailFehler = JSON.stringify(e);
				} else {
					mailGesendet = true;
				}
			} catch (e) {
				mailFehler = String(e);
			}
		}
	}

	return html(
		200,
		`
		<strong>Buchung bestätigt ✓</strong><br><br>
		Mieter: ${buchung.name ?? '–'}<br>
		Zeitraum: ${buchung.von} – ${buchung.bis}<br>
		${
			!buchung.email
				? 'Keine E-Mail-Adresse hinterlegt.'
				: !resendKey || !emailFrom
					? '<em>Mail-Env-Vars nicht gesetzt (lokal) — kein Mail gesendet.</em>'
					: mailGesendet
						? `Bestätigungsmail wurde an <strong>${buchung.email}</strong> gesendet.`
						: `E-Mail fehlgeschlagen: ${mailFehler || '–'}`
		}
		<p style="margin-top:1.5rem;font-size:0.8rem;color:#888;font-family:monospace;">CMS: ${cmsDebug}</p>
	`
	);
};

function html(status: number, body: string) {
	return new Response(
		`<!doctype html><html><head><meta charset="utf-8"><title>Buchung bestätigen</title>
		<style>body{font-family:sans-serif;padding:2rem;max-width:600px;margin:0 auto;line-height:1.6}</style>
		</head><body>${body}</body></html>`,
		{ status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
}
