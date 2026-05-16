import { json } from '@sveltejs/kit';
import { checkOutBuchung, updateRessourceBuchung } from '$lib/server/ressourceBuchungen';
import { listAnnahmenFuerBuchung, berechneCredits } from '$lib/server/aufgaben';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';

function fmt(chf: number) {
	return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(chf);
}

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
	const emailFrom = env.INVOICE_FROM_EMAIL;
	const adminSecret = env.ADMIN_SECRET;
	let toEmail = env.INVOICE_TO_EMAIL || '';
	if (!toEmail) {
		try {
			const client = createClient({ fetch });
			const settings = await client.getSingle('settings');
			const s = settings.data as any;
			toEmail = (s.responsible_email as string) || (s.e_mail as string) || '';
		} catch { /* ignore */ }
	}

	if (resendKey && toEmail && emailFrom && adminSecret) {
		const freigabeLink = `${url.origin}/api/freigabe-abrechnung?id=${encodeURIComponent(buchung.id)}&secret=${adminSecret}`;
		const [vonY, vonM, vonD] = buchung.von.split('-');
		const [bisY, bisM, bisD] = buchung.bis.split('-');

		const aufgabenZeilen = erledigt.length
			? erledigt.map((a) => `  · ${a.aufgabeTitel}: ${fmt(berechneCredits(a))}`)
			: ['  (keine)'];

		try {
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);
			await resend.emails.send({
				from: emailFrom,
				to: toEmail,
				subject: `Abrechnung freigeben: ${buchung.ressourceName ?? buchung.ressourceUid} – ${buchung.name ?? '–'}`,
				text: [
					`${buchung.name ?? '–'} hat ausgecheckt.`,
					``,
					`Ressource: ${buchung.ressourceName ?? buchung.ressourceUid}`,
					`Anreise:   ${vonD}.${vonM}.${vonY}`,
					`Abreise:   ${bisD}.${bisM}.${bisY}`,
					`Personen:  ${buchung.personen}`,
					...(items?.length ? [``, `Checkliste:`, ...items.map((i: string) => `  ${i}`)] : []),
					...(kommentar ? [``, `Kommentar:`, kommentar] : []),
					``,
					`─────────────────────────────────────`,
					`ABRECHNUNG`,
					`─────────────────────────────────────`,
					`Mietpreis:         ${fmt(buchung.preisCHF)}`,
					`Credits (Aufgaben): ${fmt(creditsCHF)}`,
					`─────────────────────────────────────`,
					`Total:             ${fmt(abrechnungBetrag)}`,
					``,
					`Erledigte Aufgaben:`,
					...aufgabenZeilen,
					``,
					`Abrechnung prüfen, korrigieren und freigeben:`,
					freigabeLink
				].join('\n')
			});
		} catch (e) {
			console.error('Check-out Abrechnungs-Mail Fehler:', e);
		}
	}

	return json({ success: true });
}
