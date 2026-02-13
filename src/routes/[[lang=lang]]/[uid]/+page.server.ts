import { asText } from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';
import { defaultLang, staticRoutes } from '$lib/i18n/i18n';

export async function load({ params, fetch, cookies }) {
	const { uid, lang = defaultLang } = params;

	// 1. Prüfen, ob die UID zu einer deiner statischen Code-Seiten gehört
	// Wir schauen, ob die UID irgendwo in den Werten von staticRoutes vorkommt
	const isStatic = Object.values(staticRoutes).some((mapping) =>
		Object.values(mapping).includes(uid)
	);

	// Wenn es eine statische Route ist, liefern wir nur die Basis-Daten zurück.
	// Prismic wird hier NICHT abgefragt, um den 500er Fehler zu vermeiden.
	if (isStatic) {
		return {
			uid,
			lang
		};
	}

	// 2. Normaler Prismic-Load für alle dynamischen CMS-Seiten
	const client = createClient({ fetch, cookies });

	try {
		const page = await client.getByUID('page', uid, { lang });

		return {
			page,
			title: asText(page.data.title),
			meta_description: page.data.meta_description,
			meta_title: page.data.meta_title,
			meta_image: page.data.meta_image?.url,
			no_index: page.data.no_index,
			lang // Wir geben die Sprache explizit mit für die Inhaltskomponenten
		};
	} catch (e) {
		console.error(`Seite ${uid} in Sprache ${lang} nicht gefunden.`);
		throw error(404, 'Page not found');
	}
}

/**
 * Für statisches Rendering (SSG)
 */
export async function entries() {
	const client = createClient();

	// Wir holen ALLE Seiten aus Prismic
	const pages = await client.getAllByType('page', { lang: '*' });

	const entries = pages.map((page) => {
		return {
			uid: page.uid,
			lang: page.lang === defaultLang ? undefined : page.lang
		};
	});

	// ZUSÄTZLICH: Die statischen Routen für SSG hinzufügen
	// Damit SvelteKit weiß, dass /en-us/privacy-policy etc. existieren
	for (const key in staticRoutes) {
		const mapping = staticRoutes[key];
		for (const [l, slug] of Object.entries(mapping)) {
			entries.push({
				uid: slug,
				lang: l === defaultLang ? undefined : l
			});
		}
	}

	return entries;
}
