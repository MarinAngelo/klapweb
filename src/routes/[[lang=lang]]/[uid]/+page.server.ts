import { asText } from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';
import { defaultLang } from '$lib/i18n/i18n';

export async function load({ params, fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	// Wir extrahieren die Sprache aus der URL.
	// Falls keine da ist (weil wir im Standard-Pfad sind), nutzen wir defaultLang.
	const lang = params.lang || defaultLang;

	try {
		// WICHTIG: Wir übergeben params.uid UND das lang-Objekt
		const page = await client.getByUID('page', params.uid, { lang });

		return {
			page,
			title: asText(page.data.title),
			meta_description: page.data.meta_description,
			meta_title: page.data.meta_title,
			meta_image: page.data.meta_image?.url,
			no_index: page.data.no_index
		};
	} catch (e) {
		// Wenn die Seite in dieser Sprache nicht existiert: 404
		console.error(`Seite ${params.uid} in Sprache ${lang} nicht gefunden.`);
		throw error(404, 'Page not found');
	}
}

/**
 * Für statisches Rendering (SSG) müssen wir SvelteKit sagen,
 * welche Kombinationen aus UID und Sprache existieren.
 */
export async function entries() {
	const client = createClient();

	// Wir holen ALLE Seiten über alle Sprachen hinweg
	const pages = await client.getAllByType('page', { lang: '*' });

	return pages.map((page) => {
		return {
			uid: page.uid,
			// Wenn es die Standardsprache ist, lassen wir 'lang' weg,
			// damit die URL sauber bleibt (z.B. /ueber-uns statt /de-ch/ueber-uns)
			lang: page.lang === defaultLang ? undefined : page.lang
		};
	});
}
