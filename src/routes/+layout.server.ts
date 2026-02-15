import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = 'auto';

export async function load({ params, fetch, cookies, url }) {
	const client = createClient({ fetch, cookies });

	// 1. Repo-Infos holen
	const repo = await client.getRepository();
	const technicalMaster = repo.languages.find((l) => l.isMaster)?.id || 'de-ch';
	const allLocales = repo.languages.map((l) => l.id);

	// 2. Settings der Master-Sprache als Basis laden
	const baseSettings = await client
		.getSingle('settings', { lang: technicalMaster })
		.catch(() => client.getSingle('settings', { lang: '*' }));

	const languageMapping: Record<string, string> = {
		Deutsch: 'de-ch',
		Englisch: 'en-us'
	};

	const selectedLabel = baseSettings?.data?.main_language;
	const mainLang = languageMapping[selectedLabel] || technicalMaster;

	// --- SPRACH-ERMITTLUNG OPTIMIERT ---
	// Wir extrahieren die Segmente nur einmal
	const segments = url.pathname.split('/').filter(Boolean);
	const firstSegment = segments[0];

	// Wenn das erste Segment eine gültige Sprache ist, nimm diese.
	// Ansonsten nimm params.lang oder die mainLang.
	const lang = allLocales.includes(firstSegment) ? firstSegment : params.lang || mainLang;

	try {
		const [settings, navigation, prismicTheme, fonts] = await Promise.all([
			client.getSingle('settings', { lang }).catch(() => baseSettings),
			client
				.getSingle('navigation', { lang })
				.catch(() => client.getSingle('navigation', { lang: mainLang }).catch(() => null)),
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
			mainLang
		};
	} catch (e: any) {
		if (e.status) throw e;
		console.error('Layout Load Error:', e);
		throw error(404, { message: 'Language or Content not available' });
	}
}
