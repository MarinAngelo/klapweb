import { createClient } from '$lib/prismicio';
import { asText } from '@prismicio/client';
import { error } from '@sveltejs/kit';

export const prerender = 'auto';

export async function load({ params, parent, fetch }) {
	const { lang } = await parent();
	const client = createClient({ fetch });

	try {
		const leistung = await client.getByUID('leistung', params.uid, { lang });

		if (!leistung) {
			throw error(404, { message: 'Leistung nicht gefunden' });
		}

		// Extract text excerpt for meta description (first 160 chars)
		const beschreibungText = leistung.data.beschreibung
			? asText(leistung.data.beschreibung).slice(0, 160)
			: '';

		return {
			leistung,
			title: leistung.data.label || 'Leistung',
			meta_title: leistung.data.label || 'Leistung',
			meta_description: beschreibungText || 'Leistungsdetails'
		};
	} catch (e: any) {
		if (e.status === 404) throw e;
		console.error('Leistung detail load error:', e);
		throw error(500, { message: 'Fehler beim Laden der Leistung.' });
	}
}

export async function entries() {
	const client = createClient();
	const leistungen = await client.getAllByType('leistung', { lang: '*', pageSize: 100 });

	return leistungen.map((doc) => ({
		lang: doc.lang === 'de' ? 'de-de' : doc.lang,
		uid: doc.uid
	}));
}
