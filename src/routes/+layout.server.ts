import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = 'auto';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params, fetch, cookies, url }) {
	const client = createClient({ fetch, cookies });

	try {
		// 1. Repo-Infos holen (Die technische "Wahrheit" von Prismic)
		// Wir verlassen uns zu 100% auf die Repository-Einstellungen.
		const repo = await client.getRepository();
		const technicalMaster = repo.languages.find((l) => l.isMaster)?.id || 'de-ch';
		const allLocales = repo.languages.map((l) => l.id);

		// Die mainLang ist nun immer der technische Master.
		const mainLang = technicalMaster;

		// 2. Basis-Settings laden (Referenz-Sprache ist der Master)
		const baseSettings = await client
			.getSingle('settings', { lang: mainLang })
			.catch(() => client.getSingle('settings', { lang: '*' }));

		// --- DIAGNOSE LOG (Optional, zeigt den aktiven Master an) ---
		console.log(`[i18n] Active Master: ${mainLang} | Available: ${allLocales.join(', ')}`);

		// 3. Sprach-Ermittlung für die aktuelle Route
		const segments = url.pathname.split('/').filter(Boolean);
		const firstSegment = segments[0];

		// Bestimme die Sprache: URL-Pfad (/en-us/...) hat Vorrang, dann params, dann der Master.
		const lang = allLocales.includes(firstSegment) ? firstSegment : params.lang || mainLang;

		// 4. Paralleles Laden der globalen Daten
		const [settings, navigation, prismicTheme, fonts] = await Promise.all([
			// Aktuelle Settings (Sprachspezifisch)
			client.getSingle('settings', { lang }).catch(() => baseSettings),

			// Navigation (Fallback auf mainLang, falls die Sprache im CMS noch nicht angelegt wurde)
			client
				.getSingle('navigation', { lang })
				.catch(() => client.getSingle('navigation', { lang: mainLang }).catch(() => null)),

			// Theme & Fonts (Global/Sprachunabhängig)
			client.getSingle('theme', { lang: '*' }).catch(() => null),
			client.getAllByType('font').catch(() => [])
		]);

		if (!settings) {
			throw error(404, { message: 'Critical configuration missing' });
		}

		return {
			settings,
			navigation,
			prismicTheme,
			fonts,
			lang,
			locales: allLocales,
			mainLang // WICHTIG: Steuert die Link-Generierung im Frontend
		};
	} catch (e: any) {
		if (e.status) throw e;
		console.error('Layout Load Error:', e);
		throw error(500, { message: 'Internal Server Error during Layout Load' });
	}
}
