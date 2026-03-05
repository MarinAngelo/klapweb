import { redirect, error } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { createClient } from '$lib/prismicio';
import { asText } from '@prismicio/client'; // Importiere den Helper

function localRedirectDisabled(): boolean {
	try {
		const cfg = JSON.parse(readFileSync('slicemachine.config.json', 'utf-8'));
		return cfg.home_redirect_disabled === true;
	} catch {
		return false;
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, parent }) {
	// 1. Wir holen die 'lang' vom Layout (Sicherheits-Feature von SvelteKit)
	const { lang, settings } = await parent();

	// CMS-controlled home redirect (local override via slicemachine.config.json: home_redirect_disabled)
	const sd = settings?.data as Record<string, unknown>;
	const redirectActive = sd?.home_redirect_active === true;
	const redirectUrl = sd?.home_redirect_url as string | undefined;
	if (redirectActive && redirectUrl && !localRedirectDisabled()) {
		throw redirect(302, redirectUrl);
	}
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
