/**
 * GET /api/ressource-preis?uid=...&lang=de-ch
 *
 * Returns only the preisProNacht for a ressource (for credit calculation).
 */
import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const uid = url.searchParams.get('uid');
	const lang = url.searchParams.get('lang') || 'de-ch';

	if (!uid) {
		return new Response(JSON.stringify({ error: 'uid fehlt' }), { status: 400 });
	}

	try {
		const client = createClient({ fetch });
		const doc = await client.getByUID('ressource', uid, { lang });
		const d = doc.data as any;
		return new Response(JSON.stringify({ preisProNacht: d.preis_pro_nacht ?? 0 }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		return new Response(JSON.stringify({ error: 'Ressource nicht gefunden' }), { status: 404 });
	}
};
