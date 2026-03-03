import { redirect } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';
import { asText } from '@prismicio/client'; // Importiere den Helper

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, parent }) {
	throw redirect(302, '/temp_home');
	// 1. Wir holen die 'lang' vom Layout (Sicherheits-Feature von SvelteKit)
	const { lang } = await parent();
	const client = createClient();

	try {
		// 2. Wir suchen explizit nach der UID 'home' in der ermittelten Sprache
		console.log(`[Page Load] Suche 'home' für Sprache: ${lang}`);

		const page = await client.getByUID('page', 'home', { lang });

		return {
			page,
			title: asText(page.data.title) || '', // Seiten Titel: Nutze asText, um den Titel als String zu bekommen
			meta_title: page.data.meta_title || '', // Optional: Fallback, falls meta_title nicht gesetzt ist
			meta_description: page.data.meta_description
		};
	} catch (e) {
		console.error(`[Page Load Error] Seite 'home' für Sprache ${lang} nicht gefunden.`);
		// Wenn 'home' nicht existiert, werfen wir einen 404
		throw error(404, {
			message: `Startseite 'home' für Sprache ${lang} nicht gefunden.`
		});
	}
}
