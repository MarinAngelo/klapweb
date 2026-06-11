/**
 * GET /api/aufgaben-liste?lang=de-ch
 *
 * Returns all active Aufgabe documents from Prismic CMS.
 */
import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const lang = url.searchParams.get('lang') || 'de-ch';

	try {
		const client = createClient({ fetch });
		const docs = await client.getAllByType('aufgabe', {
			lang,
			fetchLinks: ['werkzeug.titel', 'werkzeug.beschreibung', 'werkzeug.bild']
		});

		const aufgaben = docs.map((doc) => {
			const d = doc.data as any;
			const werkzeuge = (d.werkzeuge ?? [])
				.map((w: any) => w.werkzeug?.data ? {
					uid: w.werkzeug.uid ?? null,
					titel: w.werkzeug.data.titel ?? '',
					beschreibung: w.werkzeug.data.beschreibung ?? null,
					bild: w.werkzeug.data.bild?.url
						? { url: w.werkzeug.data.bild.url, alt: w.werkzeug.data.bild.alt ?? '' }
						: null
				} : null)
				.filter(Boolean);
			return {
				uid: doc.uid,
				titel: d.titel ?? '',
				beschreibung: d.beschreibung ?? null,
				bild: d.bild?.url ? { url: d.bild.url, alt: d.bild.alt ?? '' } : null,
				aktiv: d.aktiv !== false,
				max_annahmen: d.max_annahmen ?? 0,
				credit_typ: d.credit_typ ?? 'Fest',
				credit_betrag: d.credit_betrag ?? null,
				werkzeuge
			};
		});

		return new Response(JSON.stringify(aufgaben.filter((a) => a.aktiv)), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		console.error('GET /api/aufgaben-liste Fehler:', e);
		return new Response(JSON.stringify([]), { status: 500 });
	}
};
