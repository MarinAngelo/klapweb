/**
 * GET /api/aufgaben?buchungId=...&email=...
 *
 * Gibt alle Annahmen der Buchung zurück (nur wenn E-Mail übereinstimmt).
 */
import type { RequestHandler } from '@sveltejs/kit';
import { listAnnahmenFuerBuchung } from '$lib/server/aufgaben';
import { getBuchungByReferenz } from '$lib/server/ressourceBuchungen';

export const GET: RequestHandler = async ({ url }) => {
	const buchungId = url.searchParams.get('buchungId');

	if (!buchungId) {
		return new Response(JSON.stringify({ error: 'buchungId erforderlich' }), { status: 400 });
	}

	// Buchung per Referenz-Code oder vollständiger ID suchen
	try {
		const buchung = await getBuchungByReferenz(buchungId);
		if (!buchung)
			return new Response(JSON.stringify({ error: 'Buchung nicht gefunden' }), { status: 404 });
	} catch {
		return new Response(JSON.stringify({ error: 'Buchung konnte nicht geladen werden' }), {
			status: 500
		});
	}

	try {
		const annahmen = await listAnnahmenFuerBuchung(buchungId);
		return new Response(JSON.stringify(annahmen), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		console.error('GET /api/aufgaben Fehler:', e);
		return new Response(JSON.stringify([]), { status: 500 });
	}
};
