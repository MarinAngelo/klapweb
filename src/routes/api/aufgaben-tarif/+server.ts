/**
 * GET /api/aufgaben-tarif?buchungId=...
 *
 * Rate for time-based credits of a booking: credits = minutes / 60 × price per night (CHF).
 * Returns { chfProMinute, eurProMinute } — EUR at today's rate (null if unavailable).
 */
import type { RequestHandler } from '@sveltejs/kit';
import { getBuchungByReferenz } from '$lib/server/ressourceBuchungen';
import { createClient } from '$lib/prismicio';
import { fetchExchangeRates } from '$lib/utils/exchangeRates.server';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const buchungId = url.searchParams.get('buchungId');
	if (!buchungId) return json({ error: 'buchungId erforderlich' }, 400);

	try {
		const buchung = await getBuchungByReferenz(buchungId);
		if (!buchung?.ressourceUid) return json({ error: 'Buchung nicht gefunden' }, 404);

		const client = createClient({ fetch });
		const doc = await client.getByUID('ressource' as any, buchung.ressourceUid, { lang: 'de-ch' });
		const preisProNacht = Number((doc.data as any).preis_pro_nacht) || 0;
		if (!preisProNacht) return json({ chfProMinute: null, eurProMinute: null });

		const chfProMinute = preisProNacht / 60;
		const rates = await fetchExchangeRates('CHF', ['EUR']);
		const eurProMinute = rates.EUR ? chfProMinute * rates.EUR : null;
		return json({ chfProMinute, eurProMinute });
	} catch (e) {
		console.error('GET /api/aufgaben-tarif Fehler:', e);
		return json({ error: 'Tarif konnte nicht geladen werden' }, 500);
	}
};

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}
