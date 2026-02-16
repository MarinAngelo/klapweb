import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export async function load({ params, parent }) {
	// 1. WICHTIG: Sprache vom Layout holen
	const { lang } = await parent();
	const client = createClient();

	try {
		// 2. Dokument über UID und die ermittelte Sprache (de-de) suchen
		const page = await client.getByUID('page', params.uid, { lang });

		return {
			page,
			title: page.data.meta_title,
			meta_description: page.data.meta_description
		};
	} catch (e) {
		console.error(`[404] UID: ${params.uid} nicht gefunden für Sprache: ${lang}`);
		throw error(404, { message: 'Seite nicht gefunden' });
	}
}

// Hier darf entries stehen, da es eine +page.server.ts ist
/** @type {import('./$types').EntryGenerator} */
export async function entries() {
	const client = createClient();
	const pages = await client.getAllByType('page', { lang: '*' });

	return pages
		.map((page) => {
			if (page.uid === 'home') return null;
			return {
				lang: page.lang,
				uid: page.uid
			};
		})
		.filter(Boolean);
}
