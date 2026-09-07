/**
 * POST /api/buche-ressource
 *
 * Body (JSON):
 * {
 *   ressourceUid: string;
 *   von: string;        // YYYY-MM-DD
 *   bis: string;        // YYYY-MM-DD (checkout, exclusive)
 *   personen: number;
 *   name: string;
 *   email: string;
 *   telefon?: string;
 *   nachricht?: string;
 * }
 *
 * Responses:
 *   200  { ok: true, buchungId: string, preisCHF: number }
 *   400  { error: string }
 *   409  { error: 'NICHT_VERFUEGBAR' }
 *   500  { error: string }
 */
import type { RequestHandler } from '@sveltejs/kit';
import { bucheRessource, getRelatedRessourceUids } from '$lib/server/ressourceBuchungen';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';

function naechte(von: string, bis: string): number {
	return Math.round((new Date(bis).getTime() - new Date(von).getTime()) / (1000 * 60 * 60 * 24));
}

/** Returns the seasonal price for a given date, or falls back to base price. */
function preisProNacht(
	datum: string,
	saisonpreise: Array<{ von: string; bis: string; preis_pro_nacht: number }>,
	basispreis: number
): number {
	const saison = saisonpreise.find((s) => s.von <= datum && datum < s.bis);
	return saison?.preis_pro_nacht ?? basispreis;
}

/** Calculate total price respecting seasonal pricing (per-night). */
function berechneTotalpreis(
	von: string,
	bis: string,
	saisonpreise: Array<{ von: string; bis: string; preis_pro_nacht: number }>,
	basispreis: number
): number {
	let total = 0;
	const current = new Date(von);
	const end = new Date(bis);
	while (current < end) {
		const dateStr = current.toISOString().slice(0, 10);
		total += preisProNacht(dateStr, saisonpreise, basispreis);
		current.setDate(current.getDate() + 1);
	}
	return total;
}

export const POST: RequestHandler = async ({ request, fetch, url }) => {
	let body: {
		ressourceUid?: string;
		von?: string;
		bis?: string;
		personen?: number;
		zimmerauswahl?: Array<{ zimmer_name: string; bett_typ: string; anzahl_betten: number }>;
		name?: string;
		email?: string;
		telefon?: string;
		nachricht?: string;
	};

	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Ungültige Anfrage' }), { status: 400 });
	}

	const { ressourceUid, von, bis, personen, zimmerauswahl, name, email, telefon, nachricht } = body;

	// Validation
	if (!ressourceUid || !von || !bis || !personen || !name || !email || !telefon) {
		return new Response(JSON.stringify({ error: 'Pflichtfelder fehlen' }), { status: 400 });
	}
	if (von >= bis) {
		return new Response(JSON.stringify({ error: 'Abreise muss nach Anreise liegen' }), {
			status: 400
		});
	}

	// Load resource from Prismic for validation and price calculation
	let maxPersonen = 0;
	let minNaechte = 1;
	let basispreis = 0;
	let saisonpreise: Array<{ von: string; bis: string; preis_pro_nacht: number }> = [];
	let ressourceName = ressourceUid;
	let companyEmail = '';
	let fromEmail = '';

	try {
		const client = createClient({ fetch });
		const [doc, settings] = await Promise.all([
			client.getByUID('ressource', ressourceUid),
			client.getSingle('settings').catch(() => null)
		]);

		const d = doc.data as any;
		ressourceName = d.name ?? ressourceUid;
		maxPersonen = d.max_personen ?? 0;
		minNaechte = d.min_naechte ?? 1;
		basispreis = d.preis_pro_nacht ?? 0;
		saisonpreise = (d.saisonpreise ?? [])
			.map((s: any) => ({
				von: s.von ?? '',
				bis: s.bis ?? '',
				preis_pro_nacht: s.preis_pro_nacht ?? basispreis
			}))
			.filter((s: { von: string; bis: string }) => s.von && s.bis);

		if (settings) {
			const s = settings.data as any;
			companyEmail = (s.responsible_email as string) ?? (s.e_mail as string) ?? '';
			fromEmail = (s.booking_from_email as string) ?? '';
		}
	} catch {
		return new Response(JSON.stringify({ error: 'Ressource nicht gefunden' }), { status: 404 });
	}

	// Capacity check
	if (maxPersonen > 0 && personen > maxPersonen) {
		return new Response(JSON.stringify({ error: `Maximale Personenanzahl: ${maxPersonen}` }), {
			status: 400
		});
	}

	// Min nights check
	const anzahlNaechte = naechte(von, bis);
	if (anzahlNaechte < minNaechte) {
		return new Response(JSON.stringify({ error: `Mindestaufenthalt: ${minNaechte} Nächte` }), {
			status: 400
		});
	}

	const preisCHF = berechneTotalpreis(von, bis, saisonpreise, basispreis);

	// Save booking (includes overlap check across parent/child resources)
	let buchung;
	try {
		const conflictUids = await getRelatedRessourceUids(ressourceUid, fetch);
		buchung = await bucheRessource(
			{
				ressourceUid,
				ressourceName,
				von,
				bis,
				personen,
				zimmerauswahl: zimmerauswahl ?? [],
				preisCHF,
				bookedAt: new Date().toISOString(),
				status: 'pending',
				name,
				email,
				telefon,
				nachricht
			},
			conflictUids
		);
	} catch (e: any) {
		if (e?.message === 'CONFLICT') {
			return new Response(JSON.stringify({ error: 'NICHT_VERFUEGBAR' }), { status: 409 });
		}
		const detail = e?.message ?? String(e);
		console.error('Buchung speichern fehlgeschlagen:', detail);
		return new Response(
			JSON.stringify({ error: 'Buchung konnte nicht gespeichert werden', detail }),
			{ status: 500 }
		);
	}

	// Vermieter-Benachrichtigung mit Bestätigungslink
	const resendKey = env.RESEND_API_KEY;
	const toEmail = env.INVOICE_TO_EMAIL || companyEmail;
	const emailFrom = fromEmail || env.INVOICE_FROM_EMAIL;
	const adminSecret = env.ADMIN_SECRET;

	if (resendKey && emailFrom && toEmail && adminSecret) {
		const origin = url.origin;
		const bestaetigungsLink = `${origin}/api/bestaetige-buchung?id=${encodeURIComponent(buchung.id)}&secret=${adminSecret}`;

		const [vonY, vonM, vonD] = von.split('-');
		const [bisY, bisM, bisD] = bis.split('-');
		const vonFormatted = `${vonD}.${vonM}.${vonY}`;
		const bisFormatted = `${bisD}.${bisM}.${bisY}`;
		const preisFormatted = new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: 'CHF'
		}).format(preisCHF);

		const zimmerZeilen = (zimmerauswahl ?? []).map(
			(z) => `           · ${z.zimmer_name || z.bett_typ} (${z.anzahl_betten}× ${z.bett_typ})`
		);
		const buchungsDetails = [
			`Ressource: ${ressourceName} (${ressourceUid})`,
			`Anreise:   ${vonFormatted}`,
			`Abreise:   ${bisFormatted}`,
			`Nächte:    ${anzahlNaechte}`,
			`Personen:  ${personen}`,
			...(zimmerZeilen.length ? [`Zimmer:`, ...zimmerZeilen] : [`Zimmer:    Ganze Wohnung`]),
			`Total:     ${preisFormatted}`
		].join('\n');

		try {
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);
			const { error: mailError } = await resend.emails.send({
				from: emailFrom,
				to: toEmail,
				subject: `Neue Buchungsanfrage: ${ressourceName}`,
				text: [
					`Neue Buchungsanfrage eingegangen.`,
					``,
					buchungsDetails,
					``,
					`Kontakt:`,
					`Name:     ${name}`,
					`E-Mail:   ${email}`,
					...(telefon ? [`Telefon:  ${telefon}`] : []),
					...(nachricht ? [``, `Nachricht:`, nachricht] : []),
					``,
					`─────────────────────────────────────`,
					`Anfrage bestätigen (Mieter erhält dann die Bestätigungsmail):`,
					bestaetigungsLink
				].join('\n')
			});
			if (mailError) console.error('Buchung Anbieter-E-Mail fehlgeschlagen:', mailError);
		} catch (e) {
			console.error('Buchung E-Mail Fehler:', e);
		}
	}

	return new Response(JSON.stringify({ ok: true, buchungId: buchung.id, preisCHF }), {
		status: 200
	});
};
