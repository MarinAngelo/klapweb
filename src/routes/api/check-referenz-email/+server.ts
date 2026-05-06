/**
 * GET /api/check-referenz-email?email=...
 *
 * Returns { found: true } if the email matches any existing ressource booking.
 */
import type { RequestHandler } from '@sveltejs/kit';
import { listAlleRessourceBuchungen } from '$lib/server/ressourceBuchungen';

export const GET: RequestHandler = async ({ url }) => {
	const email = url.searchParams.get('email')?.trim().toLowerCase();
	if (!email) {
		return new Response(JSON.stringify({ found: false }), { headers: { 'Content-Type': 'application/json' } });
	}

	try {
		const buchungen = await listAlleRessourceBuchungen();
		const found = buchungen.some((b) => b.email?.toLowerCase() === email);
		return new Response(JSON.stringify({ found }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		console.error('GET /api/check-referenz-email Fehler:', e);
		return new Response(JSON.stringify({ found: false }), { status: 500 });
	}
};
