import { asText } from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';
import { staticRoutes } from '$lib/i18n/i18n';

export async function load({ params, fetch, cookies, parent }) {
	const { mainLang } = await parent();

	// 1. Parameter auflösen: Falls UID fehlt (z.B. Route /de-ch/), wird 'home' gesetzt
	const lang = params.lang || mainLang;
	const uid = params.uid || 'home';

	// 2. Prüfung auf statische Routen (Impressum, etc.)
	const isStatic = Object.values(staticRoutes).some((mapping) =>
		Object.values(mapping).includes(uid)
	);

	if (isStatic) {
		return { uid, lang };
	}

	const client = createClient({ fetch, cookies });

	try {
		// Wir suchen EXAKT nach der UID in der gewählten Sprache
		const page = await client.getByUID('page', uid, { lang });

		if (!page) {
			throw error(404, 'Page not found');
		}

		// ZUSÄTZLICHER CHECK:
		// Wenn wir eine UID haben (also nicht auf der Home sind),
		// aber Prismic uns das Home-Dokument liefert (Fallback-Verhalten),
		// erzwingen wir den Fehler.
		if (uid !== 'home' && page.uid === 'home') {
			throw error(404, 'Slug mismatch');
		}

		return {
			page,
			title: asText(page.data.title),
			// ... restliche Metadaten
			lang
		};
	} catch (e: any) {
		if (e.status) throw e;
		// Hier schlagen wir den Nagel ein:
		// Wenn die Seite nicht da ist, STOPP. Keine Homepage laden.
		throw error(404, `Seite "${uid}" existiert nicht auf ${lang}`);
	}
}

/**
 * Für statisches Rendering (SSG) - Synchron mit Layout-Mapping
 */
export async function entries() {
	const client = createClient();

	const languageMapping: Record<string, string> = {
		Deutsch: 'de-ch',
		Englisch: 'en-us'
	};

	const allSettings = await client.getAllByType('settings', { lang: '*' });
	const rawMainLang = allSettings[0]?.data?.main_language;
	const mainLang = languageMapping[rawMainLang] || 'de-ch';

	const pages = await client.getAllByType('page', { lang: '*' });

	const entries = pages.map((page) => {
		return {
			// Homepage-Logik: UID weglassen für saubere Root-URLs (/de-ch)
			uid: page.uid === 'home' ? undefined : page.uid,
			lang: page.lang === mainLang ? undefined : page.lang
		};
	});

	// Statische Routen hinzufügen
	for (const key in staticRoutes) {
		const mapping = staticRoutes[key];
		for (const [l, slug] of Object.entries(mapping)) {
			entries.push({
				uid: slug,
				lang: l === mainLang ? undefined : l
			});
		}
	}

	return entries;
}
