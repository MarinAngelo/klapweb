import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = true;

export async function load({ params, parent, fetch }) {
	const { lang } = await parent();
	const client = createClient({ fetch });

	try {
		const leistungen = await client.getAllByType('leistung', {
			lang,
			pageSize: 100,
			orderings: { field: 'document.first_publication_date', direction: 'desc' }
		});

		return {
			leistungen: leistungen.map((doc) => ({
				uid: doc.uid,
				label: doc.data.label,
				beschreibung: doc.data.beschreibung,
				first_publication_date: doc.first_publication_date
			}))
		};
	} catch (e) {
		console.error('Leistungen load error:', e);
		throw error(500, { message: 'Fehler beim Laden der Leistungen.' });
	}
}

export async function entries() {
	const client = createClient();
	const leistungen = await client.getAllByType('leistung', { lang: '*' });
	const uniqueLangs = [...new Set(leistungen.map((d) => d.lang))];

	return uniqueLangs.map((lang) => ({
		lang: lang === 'de' ? 'de-de' : lang
	}));
}
