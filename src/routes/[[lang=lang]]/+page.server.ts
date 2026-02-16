import { asText, filter } from '@prismicio/client'; // NEU: filter direkt importieren
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export async function load({ params, fetch, cookies, parent }) {
	const { mainLang } = await parent(); // Die dynamische Hauptsprache vom Layout holen
	const client = createClient({ fetch, cookies });

	const lang = params.lang || mainLang;

	try {
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
		throw error(404, 'Startseite nicht gefunden');
	}
}

/**
 * Erzeugt die Pfade für die Homepages beim Build.
 */
/** @type {import('./$types').EntryGenerator} */
export async function entries() {
    const client = createClient();

    const languageMapping: Record<string, string> = {
        'Deutsch': 'de-ch',
        'Englisch': 'en-us'
    };

    const allSettings = await client.getAllByType('settings', { lang: '*' });
    const rawMainLang = allSettings?.[0]?.data?.main_language;
    const mainLang = languageMapping[rawMainLang] || 'de-ch';

    // Wir holen NUR die Dokumente mit der UID 'home'
    const pages = await client.getAllByType('page', {
        lang: '*',
        filters: [filter.at('my.page.uid', 'home')]
    });

    return pages.map((page) => {
        return {
            // Wenn es die Hauptsprache ist, wird der Pfad zu "/" (undefined)
            // Wenn nicht, wird er zu "/en-us" etc.
            lang: page.lang === mainLang ? undefined : page.lang
        };
    });
}