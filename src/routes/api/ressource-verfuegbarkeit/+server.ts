import type { RequestHandler } from '@sveltejs/kit';
import { getBelegtePerioden, getRelatedRessourceUids } from '$lib/server/ressourceBuchungen';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const uid = url.searchParams.get('uid');
	if (!uid) {
		return new Response(JSON.stringify({ error: 'uid fehlt' }), { status: 400 });
	}

	try {
		const allUids = await getRelatedRessourceUids(uid, fetch);
		const lang = url.searchParams.get('lang') ?? undefined;
		const perioden = await getBelegtePerioden(allUids, lang);
		return new Response(JSON.stringify(perioden), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		console.error('GET /api/ressource-verfuegbarkeit Fehler:', e);
		return new Response(JSON.stringify([]), { status: 500 });
	}
};
