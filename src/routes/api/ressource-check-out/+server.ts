import { json } from '@sveltejs/kit';
import { checkoutBillingMail } from '$lib/server/ressourceMail';
import { checkOutBuchung, updateRessourceBuchung } from '$lib/server/ressourceBuchungen';
import { listAnnahmenFuerBuchung, berechneCredits } from '$lib/server/aufgaben';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';
import { adminActionToken } from '$lib/server/adminAuth';
import { getMailFrom, getNotifyTo } from '$lib/server/mailFrom';

export async function POST({ request, fetch, url }) {
	const { referenz, items, kommentar } = await request.json();
	if (!referenz?.trim()) return json({ error: 'Buchungsreferenz fehlt.' }, { status: 400 });

	let buchung;
	try {
		buchung = await checkOutBuchung(referenz.trim(), items ?? []);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'NOT_FOUND') return json({ error: 'NOT_FOUND' }, { status: 404 });
		if (msg === 'ALREADY_DONE') return json({ error: 'ALREADY_DONE' }, { status: 409 });
		return json({ error: 'SERVER_ERROR' }, { status: 500 });
	}

	// ── Credits aus erledigten Aufgaben berechnen ──────────────────────────
	const annahmen = await listAnnahmenFuerBuchung(buchung.id).catch(() => []);
	const erledigt = annahmen.filter((a) => a.status === 'erledigt');
	const creditsCHF = erledigt.reduce((sum, a) => sum + berechneCredits(a), 0);
	const abrechnungBetrag = Math.max(0, buchung.preisCHF - creditsCHF);

	// Credits auf Buchung speichern
	await updateRessourceBuchung(buchung.id, { creditsCHF, abrechnungBetrag }).catch(() => null);

	// ── Betreiber-Mail mit Abrechnung + Freigabe-Link ──────────────────────
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

	if (resendKey && toEmail && emailFrom && env.ADMIN_SECRET) {
		// Token only authorises this approval — the admin password is never sent by mail
		const freigabeLink = `${url.origin}/api/freigabe-abrechnung?id=${encodeURIComponent(buchung.id)}&token=${adminActionToken('freigabe-abrechnung', buchung.id)}`;
		try {
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);
			await resend.emails.send({
				from: emailFrom,
				to: toEmail,
				...checkoutBillingMail({
					...buchung,
					items,
					kommentar,
					creditsCHF,
					abrechnungBetrag,
					aufgaben: erledigt.map((a) => ({ titel: a.aufgabeTitel, credits: berechneCredits(a) })),
					freigabeLink
				})
			});
		} catch (e) {
			console.error('Check-out Abrechnungs-Mail Fehler:', e);
		}
	}

	return json({ success: true });
}
