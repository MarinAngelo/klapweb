/**
 * GET /api/ressource-verfuegbarkeit?uid=ferienhaus-tessin
 *
 * Returns all booked periods with their booked room names, so the frontend
 * can compute full vs. partial availability per day.
 *
 * Response: Array<{ von: string; bis: string; zimmer: string[] }>
 */
import type { RequestHandler } from '@sveltejs/kit';
import { getBelegtePerioden } from '$lib/server/ressourceBuchungen';

export const GET: RequestHandler = async ({ url }) => {
	const uid = url.searchParams.get('uid');
	if (!uid) {
		return new Response(JSON.stringify({ error: 'uid fehlt' }), { status: 400 });
	}

	try {
		const perioden = await getBelegtePerioden(uid);
		return new Response(JSON.stringify(perioden), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		console.error('GET /api/ressource-verfuegbarkeit Fehler:', e);
		return new Response(JSON.stringify([]), { status: 500 });
	}
};
