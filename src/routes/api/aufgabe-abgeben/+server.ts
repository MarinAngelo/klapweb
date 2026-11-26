/**
 * POST /api/aufgabe-abgeben
 *
 * Body: { annahmeId, email, minuten? }
 * Marks an accepted task as done; calculates credits for open type.
 */
import type { RequestHandler } from '@sveltejs/kit';
import { getAnnahme, updateAnnahme, berechneCredits } from '$lib/server/aufgaben';
import { getBuchungByReferenz, getRessourceBuchung } from '$lib/server/ressourceBuchungen';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';
import { getMailFrom, getTextStyle } from '$lib/server/mailFrom';
import { loadMailTheme } from '$lib/mailLayout.js';
import {
	taskSubmittedLines,
	taskSubmittedMail,
	taskSubmittedOperatorMail
} from '$lib/server/aufgabenMails';

export const POST: RequestHandler = async ({ request, fetch }) => {
	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return new Response(JSON.stringify({ error: 'Ungültige Anfrage' }), { status: 400 });
	}

	const annahmeId = form.get('annahmeId') as string;
	const minuten = form.get('minuten') ? Number(form.get('minuten')) : undefined;
	const kommentar = (form.get('kommentar') as string) || undefined;
	const attachmentFile =
		form.get('attachment') instanceof File ? (form.get('attachment') as File) : null;

	if (!annahmeId) {
		return new Response(JSON.stringify({ error: 'Pflichtfelder fehlen' }), { status: 400 });
	}
	if (!kommentar?.trim()) {
		return new Response(JSON.stringify({ error: 'Kommentar ist erforderlich' }), { status: 400 });
	}

	let annahme;
	try {
		annahme = await getAnnahme(annahmeId);
		if (!annahme)
			return new Response(JSON.stringify({ error: 'Annahme nicht gefunden' }), { status: 404 });
		if (!['angenommen', 'annahme_bestaetigt'].includes(annahme.status)) {
			return new Response(JSON.stringify({ error: 'Aufgabe kann nicht abgegeben werden' }), {
				status: 409
			});
		}
	} catch {
		return new Response(JSON.stringify({ error: 'Annahme konnte nicht geladen werden' }), {
			status: 500
		});
	}

	// Abgabe nur während des Aufenthalts (Anreisetag bis Abreisetag, exkl.)
	try {
		const buchung = await getBuchungByReferenz(annahme.buchungId);
		if (buchung) {
			const heute = new Date().toISOString().slice(0, 10);
			if (heute < buchung.von || heute >= buchung.bis) {
				return new Response(
					JSON.stringify({
						error: 'Abgabe nur während des Aufenthalts möglich (Anreise bis Abreise)'
					}),
					{ status: 409 }
				);
			}
		}
	} catch {
		/* Buchung nicht ladbar — Abgabe nicht blockieren */
	}

	if (annahme.creditTyp === 'offen' && (!minuten || minuten <= 0)) {
		return new Response(
			JSON.stringify({ error: 'Minuten erforderlich für zeitbasierte Credits' }),
			{ status: 400 }
		);
	}

	const minutenVal = annahme.creditTyp === 'offen' ? Number(minuten) : undefined;
	const credits = berechneCredits({
		creditTyp: annahme.creditTyp,
		creditBetrag: annahme.creditBetrag,
		preisProNacht: annahme.preisProNacht,
		minuten: minutenVal
	});

	let updated;
	try {
		updated = await updateAnnahme(annahmeId, {
			status: 'abgegeben',
			minuten: minutenVal,
			credits,
			kommentar: kommentar || undefined,
			eingereichtAt: new Date().toISOString()
		});
	} catch (e: any) {
		console.error('POST /api/aufgabe-abgeben Fehler:', e);
		return new Response(JSON.stringify({ error: 'Abgabe konnte nicht gespeichert werden' }), {
			status: 500
		});
	}

	// Abrechnungs-Mail senden
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = await getMailFrom();
	let adminEmail = '';
	try {
		const client = createClient({ fetch });
		const settings = await client.getSingle('settings').catch(() => null);
		if (settings) {
			const s = settings.data as any;
			adminEmail = (s.responsible_email as string) ?? (s.e_mail as string) ?? '';
		}
	} catch {
		/* non-critical */
	}

	if (resendKey && emailFrom) {
		// Buchungspreis laden für Abrechnung
		let buchungspreis: number | null = null;
		try {
			const buchung = await getRessourceBuchung(annahme.buchungId);
			if (buchung) buchungspreis = buchung.preisCHF;
		} catch {
			/* non-critical */
		}

		const lines = taskSubmittedLines({
			titel: annahme.aufgabeTitel,
			minuten: minutenVal,
			kommentar,
			credits,
			buchungspreis
		});
		const [style, theme] = await Promise.all([
			getTextStyle(),
			loadMailTheme(createClient({ fetch })).catch(() => null)
		]);

		try {
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);

			const attachments: { filename: string; content: Buffer }[] = [];
			if (attachmentFile && attachmentFile.size > 0) {
				const buf = Buffer.from(await attachmentFile.arrayBuffer());
				attachments.push({ filename: attachmentFile.name, content: buf });
			}

			const sends: Promise<any>[] = [];

			if (annahme.email) {
				sends.push(
					resend.emails
						.send({
							from: emailFrom,
							to: annahme.email,
							...taskSubmittedMail({
								titel: annahme.aufgabeTitel,
								name: annahme.name,
								lines,
								style,
								theme
							})
						})
						.then(({ error: e }) => {
							if (e) console.error('Abrechnung Nutzer-Mail fehlgeschlagen:', e);
						})
				);
			}

			if (adminEmail) {
				sends.push(
					resend.emails
						.send({
							from: emailFrom,
							to: adminEmail,
							...taskSubmittedOperatorMail({
								titel: annahme.aufgabeTitel,
								name: annahme.name,
								email: annahme.email,
								buchungId: annahme.buchungId,
								lines
							}),
							...(attachments.length > 0 ? { attachments } : {})
						})
						.then(({ error: e }) => {
							if (e) console.error('Abrechnung Betreiber-Mail fehlgeschlagen:', e);
						})
				);
			}

			await Promise.all(sends);
		} catch (e) {
			console.error('E-Mail-Versand fehlgeschlagen:', e);
		}
	}

	return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
