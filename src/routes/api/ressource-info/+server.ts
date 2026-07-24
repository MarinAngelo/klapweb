/**
 * GET /api/ressource-info?uid=ferienhaus-tessin&lang=de-ch
 *
 * Returns metadata for a ressource document so the RessourceBuchung slice
 * can be self-sufficient regardless of which page type it's placed on.
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
		const doc = await client.getByUID('ressource', uid, { lang, fetchLinks: ['ressource.name'] });
		const d = doc.data as any;

		const schlafzimmer = (d.schlafzimmer ?? []).map((z: any) => ({
			zimmer_name: z.zimmer_name ?? '',
			bett_typ: z.bett_typ ?? '',
			anzahl_betten: z.anzahl_betten ?? 1,
			bild: z.bild?.url ? { url: z.bild.url, alt: z.bild.alt ?? '' } : null
		}));

		const saisonpreise = (d.saisonpreise ?? [])
			.filter((s: any) => s.von && s.bis)
			.map((s: any) => ({
				von: s.von as string,
				bis: s.bis as string,
				preis_pro_nacht: (s.preis_pro_nacht as number) ?? (d.preis_pro_nacht as number) ?? 0
			}));

		return new Response(JSON.stringify({
			uid: doc.uid,
			name: d.name ?? '',
			maxPersonen: d.max_personen ?? 0,
			minNaechte: d.min_naechte ?? 1,
			preisProNacht: d.preis_pro_nacht ?? 0,
			zimmerEinzelbuchbar: d.zimmer_einzelbuchbar ?? false,
			saisonpreise,
			schlafzimmer
		}), { headers: { 'Content-Type': 'application/json' } });
	} catch {
		return new Response(JSON.stringify({ error: 'Ressource nicht gefunden' }), { status: 404 });
	}
};
