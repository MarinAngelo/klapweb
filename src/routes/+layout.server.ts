import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = 'auto';

export async function load({ params, fetch, cookies, url }) {
	const client = createClient({ fetch, cookies });

	// 1. Repo-Infos holen (Die technische "Wahrheit" von Prismic)
	const repo = await client.getRepository();
	const technicalMaster = repo.languages.find((l) => l.isMaster)?.id || 'de-ch';
	const allLocales = repo.languages.map((l) => l.id);

	// 2. Settings laden
	// Wir versuchen zuerst den technischen Master, falls das fehlschlägt, irgendeine Sprache
	const baseSettings = await client
		.getSingle('settings', { lang: technicalMaster })
		.catch(() => client.getSingle('settings', { lang: '*' }));

	// 3. Sicherheits-Check & mainLang Ermittlung
	const languageMapping: Record<string, string> = {
		Deutsch: 'de-ch',
		Englisch: 'en-us'
	};

	const selectedLabel = baseSettings?.data?.main_language;
	let mainLang = languageMapping[selectedLabel] || technicalMaster;

	// --- DIAGNOSE LOGS (Nur für die Entwicklung) ---
	console.log('--- i18n Check ---');
	console.log('Prismic Master (API):', technicalMaster);
	console.log('Gewählt im CMS (Label):', selectedLabel);
	console.log('Daraus resultierende mainLang:', mainLang);

	// Der eigentliche Sicherheits-Check
	if (!allLocales.includes(mainLang)) {
		console.warn(
			`⚠️ [i18n] WARNUNG: "${mainLang}" ist nicht im Repo aktiv! Fallback auf ${technicalMaster}.`
		);
		mainLang = technicalMaster;
	} else if (mainLang !== technicalMaster) {
		console.warn(
			`ℹ️ [i18n] INFO: Die CMS-Hauptsprache (${mainLang}) weicht vom technischen Master (${technicalMaster}) ab.`
		);
	}
	console.log('------------------');

	// ZUSÄTZLICHER CHECK: Ist die gewählte mainLang überhaupt im Repo aktiv?
	if (!allLocales.includes(mainLang)) {
		console.warn(
			`[i18n] Gewählte Sprache "${mainLang}" nicht im Repo aktiv. Fallback auf ${technicalMaster}.`
		);
		mainLang = technicalMaster;
	}

	// 4. Sprach-Ermittlung für die aktuelle Route
	const segments = url.pathname.split('/').filter(Boolean);
	const firstSegment = segments[0];

	// Wenn URL mit Sprach-Code startet (/en-us/...), nimm diesen.
	// Sonst nimm params.lang oder die ermittelte mainLang.
	const lang = allLocales.includes(firstSegment) ? firstSegment : params.lang || mainLang;

	try {
		// 5. Paralleles Laden aller globalen Daten für die Zielsprache
		const [settings, navigation, prismicTheme, fonts] = await Promise.all([
			// Aktuelle Settings (für SEO etc.)
			client.getSingle('settings', { lang }).catch(() => baseSettings),

			// Navigation (Fallback auf mainLang, falls für Ziel-Sprache nicht vorhanden)
			client
				.getSingle('navigation', { lang })
				.catch(() => client.getSingle('navigation', { lang: mainLang }).catch(() => null)),

			// Theme & Fonts (Sprachunabhängig)
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
			mainLang // WICHTIG: Wird an Layout/Switcher für URL-Logik gereicht
		};
	} catch (e: any) {
		if (e.status) throw e;
		console.error('Layout Load Error:', e);
		throw error(404, { message: 'Language or Content not available' });
	}
}
