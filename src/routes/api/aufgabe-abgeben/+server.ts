/**
 * POST /api/aufgabe-abgeben
 *
 * Body: { annahmeId, email, minuten? }
 * Marks an accepted task as done; calculates credits for open type.
 */
import type { RequestHandler } from '@sveltejs/kit';
import { getAnnahme, updateAnnahme, berechneCredits } from '$lib/server/aufgaben';
import { getRessourceBuchung } from '$lib/server/ressourceBuchungen';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';

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
			status: 'eingereicht',
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
	let emailFrom = env.INVOICE_FROM_EMAIL;
	let adminEmail = '';
	try {
		const client = createClient({ fetch });
		const settings = await client.getSingle('settings').catch(() => null);
		if (settings) {
			const s = settings.data as any;
			adminEmail = (s.responsible_email as string) ?? (s.e_mail as string) ?? '';
			emailFrom = (s.booking_from_email as string) || emailFrom;
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

		const creditsFormatted = new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: 'CHF'
		}).format(credits);
		const preisFormatted =
			buchungspreis != null
				? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(
						buchungspreis
					)
				: null;
		const restFormatted =
			buchungspreis != null
				? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(
						Math.max(0, buchungspreis - credits)
					)
				: null;

		const abrechnungsZeilen = [
			`Aufgabe:        ${annahme.aufgabeTitel}`,
			...(minutenVal ? [`Geleistete Zeit: ${minutenVal} Minuten`] : []),
			...(kommentar ? [`Kommentar:      ${kommentar}`] : []),
			`Credits:        ${creditsFormatted}`,
			...(preisFormatted
				? [
						``,
						`Buchungspreis:  ${preisFormatted}`,
						`Abzug Credits:  ${creditsFormatted}`,
						`Restbetrag:     ${restFormatted}`
					]
				: [])
		].join('\n');

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
							subject: `Abrechnung: ${annahme.aufgabeTitel}`,
							text: [
								`Guten Tag ${annahme.name}`,
								``,
								`Vielen Dank – Ihre Aufgabe wurde erfasst und wird vom Betreiber geprüft.`,
								``,
								abrechnungsZeilen,
								``,
								`Freundliche Grüsse`
							].join('\n')
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
							subject: `Aufgabe abgegeben: ${annahme.aufgabeTitel}`,
							text: [
								`Eine Aufgabe wurde abgegeben und wartet auf Prüfung.`,
								``,
								`Name:    ${annahme.name}`,
								`E-Mail:  ${annahme.email}`,
								`Buchung: ${annahme.buchungId}`,
								``,
								abrechnungsZeilen
							].join('\n'),
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
