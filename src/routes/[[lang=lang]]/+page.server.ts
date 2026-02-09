import { asText } from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { defaultLang } from '$lib/i18n/i18n';

export async function load({ params, fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	// Falls params.lang in der URL fehlt (z.B. bei domain.com/),
	// nutzen wir die Standardsprache aus der slicemachine.config.json.
	const lang = params.lang || defaultLang;

	try {
		// Wir fragen explizit nach der UID 'home' in der gewählten Sprache.
		const page = await client.getByUID('page', 'home', { lang });

		return {
			page,
			title: asText(page.data.title),
			meta_description: page.data.meta_description,
			meta_title: page.data.meta_title,
			meta_image: page.data.meta_image?.url,
			no_index: page.data.no_index
		};
	} catch (e) {
		console.error(`Startseite 'home' für Sprache ${lang} nicht gefunden.`);
		// Ein Fallback oder 404 auslösen
		throw error(404, 'Startseite nicht gefunden');
	}
}

/**
 * Erzeugt die Pfade für den Build-Prozess.
 */
export async function entries() {
	const client = createClient();

	// Wir holen alle Versionen der 'home' Seite.
	const pages = await client.getAllByType('page', {
		lang: '*',
		filters: [
			// Filtert direkt in der API-Abfrage nach der UID 'home'
			prismic.filter.at('my.page.uid', 'home')
		]
	});

	// Wir geben die Sprachen zurück. SvelteKit generiert daraus:
	// / (für die Standard-Sprache)
	// /en-us (für Englisch) etc.
	return pages.map((page) => {
		return { lang: page.lang === defaultLang ? undefined : page.lang };
	});
}
