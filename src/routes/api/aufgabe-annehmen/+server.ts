/**
 * POST /api/aufgabe-annehmen
 *
 * Body: { buchungId, email, name, aufgabeUid, aufgabeTitel,
 *         creditTyp, creditBetrag?, ressourceUid, preisProNacht? }
 */
import type { RequestHandler } from '@sveltejs/kit';
import { createAnnahme, listAnnahmenFuerBuchung } from '$lib/server/aufgaben';
import { getBuchungByReferenz } from '$lib/server/ressourceBuchungen';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, fetch }) => {
	let body: any;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Ungültige Anfrage' }), { status: 400 });
	}

	const { buchungId, aufgabeUid, aufgabeTitel, creditTyp, creditBetrag } = body;

	if (!buchungId || !aufgabeUid || !creditTyp) {
		return new Response(JSON.stringify({ error: 'Pflichtfelder fehlen' }), { status: 400 });
	}

	// Buchung per Referenz-Code oder vollständiger ID suchen
	let ressourceUid = '';
	let guestEmail = '';
	let guestName = '';
	let preisProNacht: number | undefined;
	try {
		const buchung = await getBuchungByReferenz(buchungId);
		if (!buchung)
			return new Response(JSON.stringify({ error: 'Buchung nicht gefunden' }), { status: 404 });
		ressourceUid = buchung.ressourceUid ?? '';
		guestEmail = buchung.email ?? '';
		guestName = buchung.name ?? buchung.email ?? buchungId;
	} catch {
		return new Response(JSON.stringify({ error: 'Buchung konnte nicht geladen werden' }), {
			status: 500
		});
	}

	// Preis aus Prismic laden (nur für zeitbasierte Credits)
	if (creditTyp === 'offen' && ressourceUid) {
		try {
			const client = createClient({ fetch });
			const doc = await client.getByUID('ressource', ressourceUid, { lang: 'de-ch' });
			preisProNacht = (doc.data as any).preis_pro_nacht ?? undefined;
		} catch {
			/* non-critical */
		}
	}

	// Doppelte Annahme verhindern
	try {
		const existing = await listAnnahmenFuerBuchung(buchungId);
		if (existing.some((a) => a.aufgabeUid === aufgabeUid)) {
			return new Response(JSON.stringify({ error: 'Aufgabe bereits angenommen' }), { status: 409 });
		}
	} catch {
		/* non-critical */
	}

	try {
		const annahme = await createAnnahme({
			aufgabeUid,
			aufgabeTitel,
			buchungId,
			ressourceUid: ressourceUid ?? '',
			name: guestName,
			email: guestEmail,
			status: 'angenommen',
			creditTyp,
			creditBetrag: creditTyp === 'fest' ? (creditBetrag ?? 0) : undefined,
			preisProNacht: creditTyp === 'offen' ? preisProNacht : undefined,
			angenommenAt: new Date().toISOString()
		});
		// Operator-Benachrichtigung mit Freigabe-Link
		const resendKey = env.RESEND_API_KEY;
		const adminSecret = env.ADMIN_SECRET;

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

		if (resendKey && emailFrom && adminEmail && adminSecret) {
			const freigabeLink = `${new URL(request.url).origin}/api/freigabe-aufgabe?id=${encodeURIComponent(annahme.id)}&secret=${encodeURIComponent(adminSecret)}`;
			try {
				const { Resend } = await import('resend');
				const resend = new Resend(resendKey);
				const { error: e } = await resend.emails.send({
					from: emailFrom,
					to: adminEmail,
					subject: `Aufgabe angenommen: ${aufgabeTitel}`,
					text: [
						`Eine Aufgabe wurde angenommen und wartet auf Ihre Freigabe.`,
						``,
						`Aufgabe: ${aufgabeTitel}`,
						`Name:    ${guestName}`,
						`E-Mail:  ${guestEmail}`,
						`Buchung: ${buchungId}`,
						``,
						`─────────────────────────────────────`,
						`Annahme freigeben (Nutzer erhält dann die Bestätigungsmail):`,
						freigabeLink
					].join('\n')
				});
				if (e) console.error('Aufgabe Operator-Mail fehlgeschlagen:', e);
			} catch (e) {
				console.error('E-Mail-Versand fehlgeschlagen:', e);
			}
		}

		return new Response(JSON.stringify({ ok: true, annahmeId: annahme.id }), { status: 200 });
	} catch (e: any) {
		console.error('POST /api/aufgabe-annehmen Fehler:', e);
		return new Response(JSON.stringify({ error: 'Annahme konnte nicht gespeichert werden' }), {
			status: 500
		});
	}
};
