/**
 * GET  /api/freigabe-abrechnung?id=…&secret=…
 *   → HTML-Seite: Abrechnungsdetails + editierbarer Betrag + Freigabe-Button
 *
 * POST /api/freigabe-abrechnung?id=…&secret=…
 *   → Speichert freigegebenen Betrag, sendet definitive Abrechnung an Mieter
 */
import type { RequestHandler } from '@sveltejs/kit';
import { getRessourceBuchung, updateRessourceBuchung } from '$lib/server/ressourceBuchungen';
import { listAnnahmenFuerBuchung, berechneCredits } from '$lib/server/aufgaben';
import { env } from '$env/dynamic/private';

function fmt(chf: number) {
	return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(chf);
}

function fmtDatum(iso: string) {
	const [y, m, d] = iso.split('-');
	return `${d}.${m}.${y}`;
}

function auth(url: URL): boolean {
	const secret = url.searchParams.get('secret');
	return !!env.ADMIN_SECRET && secret === env.ADMIN_SECRET;
}

// ── GET: Freigabe-Formular ─────────────────────────────────────────────────────
export const GET: RequestHandler = async ({ url }) => {
	if (!auth(url)) return html(403, '<p>Kein Zugriff.</p>');

	const id = url.searchParams.get('id');
	if (!id) return html(400, '<p>Buchungs-ID fehlt.</p>');

	const buchung = await getRessourceBuchung(id).catch(() => null);
	if (!buchung) return html(404, '<p>Buchung nicht gefunden.</p>');

	if (buchung.status === 'abgerechnet') {
		return html(200, `
			<p>✓ Diese Abrechnung wurde bereits freigegeben.</p>
			<p><strong>Freigegebener Betrag:</strong> ${fmt(buchung.abrechnungBetrag ?? 0)}</p>
			<p>Freigegeben am: ${buchung.abrechnungFreigegebenAt ? new Date(buchung.abrechnungFreigegebenAt).toLocaleString('de-CH') : '–'}</p>
			<br><a href="?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(url.searchParams.get('secret') ?? '')}&resend=true">Abrechnung erneut senden</a>
		`);
	}

	const annahmen = await listAnnahmenFuerBuchung(id).catch(() => []);
	const erledigt = annahmen.filter((a) => a.status === 'erledigt');
	const creditsCHF = buchung.creditsCHF ?? erledigt.reduce((s, a) => s + berechneCredits(a), 0);
	const berechneterBetrag = Math.max(0, buchung.preisCHF - creditsCHF);
	const vorschlag = buchung.abrechnungBetrag ?? berechneterBetrag;

	const aufgabenRows = erledigt.length
		? erledigt.map((a) => `
			<tr>
				<td>${a.aufgabeTitel}</td>
				<td style="text-align:right">− ${fmt(berechneCredits(a))}</td>
			</tr>`).join('')
		: '<tr><td colspan="2" style="color:#888">(keine erledigten Aufgaben)</td></tr>';

	const resend = url.searchParams.get('resend') === 'true';

	return html(200, `
		<h1>Abrechnung freigeben</h1>
		<h2>${buchung.ressourceName ?? buchung.ressourceUid}</h2>
		<p>
			<strong>${buchung.name ?? '–'}</strong>${buchung.email ? ` &lt;${buchung.email}&gt;` : ''}<br>
			${fmtDatum(buchung.von)} – ${fmtDatum(buchung.bis)} · ${buchung.personen} Person(en)
		</p>

		<table>
			<tbody>
				<tr><td>Mietpreis</td><td style="text-align:right">${fmt(buchung.preisCHF)}</td></tr>
				${aufgabenRows}
			</tbody>
			<tfoot>
				<tr style="border-top:2px solid #333;font-weight:700">
					<td>Berechnetes Total</td>
					<td style="text-align:right">${fmt(berechneterBetrag)}</td>
				</tr>
			</tfoot>
		</table>

		<form method="POST" action="?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(url.searchParams.get('secret') ?? '')}${resend ? '&resend=true' : ''}">
			<fieldset>
				<legend>Manuelle Korrektur</legend>
				<label>
					Freigegebener Betrag (CHF)
					<input type="number" name="betrag" value="${vorschlag.toFixed(2)}" min="0" step="0.05" required>
				</label>
				<label>
					Interne Notiz (optional, erscheint nicht in der Mieter-Mail)
					<textarea name="notiz" rows="3" placeholder="z.B. Rabatt wegen frühem Auszug"></textarea>
				</label>
			</fieldset>
			<button type="submit">${resend ? '✉ Abrechnung erneut senden' : '✓ Freigeben &amp; Abrechnung an Mieter senden'}</button>
		</form>
	`);
};

// ── POST: Abrechnung freigeben ─────────────────────────────────────────────────
export const POST: RequestHandler = async ({ url, request }) => {
	if (!auth(url)) return html(403, '<p>Kein Zugriff.</p>');

	const id = url.searchParams.get('id');
	if (!id) return html(400, '<p>Buchungs-ID fehlt.</p>');

	const buchung = await getRessourceBuchung(id).catch(() => null);
	if (!buchung) return html(404, '<p>Buchung nicht gefunden.</p>');

	const formData = await request.formData();
	const betragRaw = formData.get('betrag');
	const notiz = (formData.get('notiz') as string | null)?.trim() || undefined;
	const betrag = betragRaw ? parseFloat(String(betragRaw)) : null;

	if (betrag === null || isNaN(betrag) || betrag < 0) {
		return html(400, '<p>Ungültiger Betrag.</p>');
	}

	const resend_ = url.searchParams.get('resend') === 'true';

	// Buchung aktualisieren
	await updateRessourceBuchung(id, {
		status: 'abgerechnet',
		abrechnungBetrag: betrag,
		abrechnungFreigegebenAt: new Date().toISOString(),
		...(notiz ? { abrechnungsNotiz: notiz } as any : {})
	});

	// ── Definitive Abrechnung an Mieter ───────────────────────────────────
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.INVOICE_FROM_EMAIL;
	let mailGesendet = false;
	let mailFehler = '';

	if (resendKey && emailFrom && buchung.email) {
		const annahmen = await listAnnahmenFuerBuchung(id).catch(() => []);
		const erledigt = annahmen.filter((a) => a.status === 'erledigt');
		const creditsCHF = buchung.creditsCHF ?? erledigt.reduce((s, a) => s + berechneCredits(a), 0);

		const aufgabenZeilen = erledigt.length
			? erledigt.map((a) => `  · ${a.aufgabeTitel}: − ${fmt(berechneCredits(a))}`).join('\n')
			: '  (keine)';

		try {
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);
			const { error: e } = await resend.emails.send({
				from: emailFrom,
				to: buchung.email,
				subject: `Ihre Abrechnung: ${buchung.ressourceName ?? buchung.ressourceUid}`,
				text: [
					`Guten Tag ${buchung.name ?? ''}`,
					``,
					`Vielen Dank für Ihren Aufenthalt. Hier ist Ihre definitive Abrechnung:`,
					``,
					`Ressource: ${buchung.ressourceName ?? buchung.ressourceUid}`,
					`Anreise:   ${fmtDatum(buchung.von)}`,
					`Abreise:   ${fmtDatum(buchung.bis)}`,
					`Buchungs-Nr.: ${buchung.referenz ?? buchung.id}`,
					``,
					`─────────────────────────────────────`,
					`Mietpreis:          ${fmt(buchung.preisCHF)}`,
					...(creditsCHF > 0 ? [
						`Credits (Aufgaben): − ${fmt(creditsCHF)}`,
						``,
						`Erledigte Aufgaben:`,
						aufgabenZeilen,
					] : []),
					`─────────────────────────────────────`,
					`Total:              ${fmt(betrag)}`,
					`─────────────────────────────────────`,
					``,
					`Freundliche Grüsse`
				].join('\n')
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

	return html(200, `
		<p>✓ <strong>Abrechnung freigegeben.</strong></p>
		<p><strong>Betrag:</strong> ${fmt(betrag)}</p>
		${notiz ? `<p><strong>Notiz:</strong> ${notiz}</p>` : ''}
		<p>${
			!buchung.email
				? 'Keine E-Mail-Adresse hinterlegt — Abrechnung nicht gesendet.'
				: mailGesendet
					? `Abrechnung wurde an <strong>${buchung.email}</strong> gesendet.`
					: `<span style="color:red">E-Mail fehlgeschlagen: ${mailFehler || '–'}</span>`
		}</p>
	`);
};

function html(status: number, body: string) {
	return new Response(
		`<!doctype html><html><head><meta charset="utf-8"><title>Abrechnung freigeben</title>
		<style>
			body { font-family: sans-serif; padding: 2rem; max-width: 640px; margin: 0 auto; line-height: 1.6; color: #222; }
			h1 { font-size: 1.4rem; margin-bottom: .25rem; }
			h2 { font-size: 1.1rem; color: #555; font-weight: normal; margin-top: 0; }
			table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; }
			td { padding: .4rem .5rem; border-bottom: 1px solid #eee; }
			tfoot td { padding-top: .6rem; }
			fieldset { border: 1px solid #ddd; border-radius: 6px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
			legend { font-weight: 600; padding: 0 .4rem; }
			label { display: block; margin-bottom: .75rem; font-size: .9rem; }
			input[type=number], textarea { display: block; width: 100%; margin-top: .25rem; padding: .5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; box-sizing: border-box; }
			button { padding: .7rem 1.5rem; background: #1e2d5a; color: #fff; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
			button:hover { background: #2a3f7a; }
			a { color: #1e2d5a; }
		</style>
		</head><body>${body}</body></html>`,
		{ status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
}
