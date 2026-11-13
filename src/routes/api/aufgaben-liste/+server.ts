/**
 * GET /api/aufgaben-liste?lang=de-ch
 *
 * Returns all active Aufgabe documents from Prismic CMS, incl. subtask info
 * (parent_uid, position, enforce_order, bonus_credits) and availability
 * (erledigt, vergeben, gesperrt_durch).
 */
import type { RequestHandler } from '@sveltejs/kit';
import { katalogMitStatus } from '$lib/server/aufgabenKatalog';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const lang = url.searchParams.get('lang') || 'de-ch';

	try {
		const aufgaben = await katalogMitStatus(fetch, lang);
		return new Response(JSON.stringify(aufgaben), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		console.error('GET /api/aufgaben-liste Fehler:', e);
		return new Response(JSON.stringify([]), { status: 500 });
	}
};
