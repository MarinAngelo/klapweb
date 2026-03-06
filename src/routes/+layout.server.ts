import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';
import { buildTokenMap } from '$lib/utils/buildTokenMap.server';

export const prerender = 'auto';

export async function load({ params, fetch, cookies, url }) {
	const client = createClient({ fetch, cookies });

	try {
		// 1. Repo-Infos (Master-Ermittlung)
		const repo = await client.getRepository();
		const technicalMaster =
			repo.languages.find((l) => l.is_master === true)?.id || repo.languages[0].id;
		const allLocales = repo.languages.map((l) => l.id);
		const mainLang = technicalMaster;

		// 2. Basis-Settings laden (vom Master)
		const baseSettings = await client.getSingle('settings', { lang: mainLang }).catch(() => null);

		if (!baseSettings) {
			throw error(
				404,
				`Kritisches Dokument fehlt: Bitte erstelle das Dokument 'Settings' für die Hauptsprache '${mainLang}' in Prismic.`
			);
		}

		// 3. Multilang-Check
		const isMultilangActive = baseSettings.data?.show_language_switcher ?? false;

		// 4. Sprach-Ermittlung der aktuellen Route
		const segments = url.pathname.split('/').filter(Boolean);
		const firstSegment = segments[0];
		let lang = allLocales.includes(firstSegment) ? firstSegment : params.lang || mainLang;

		// 5. Schutz-Mauer (Falls Multilang deaktiviert)
		if (!isMultilangActive && lang !== mainLang) {
			throw error(404, `Sprache '${lang}' ist zurzeit deaktiviert.`);
		}

		// 6. Paralleles Laden der globalen Daten mit klaren Fehlermeldungen
		const [settings, navigation, theme, fonts, variablenDoc] = await Promise.all([
			// Aktuelle Settings (müssen für jede Sprache existieren)
			client.getSingle('settings', { lang }).catch(() => {
				throw error(
					404,
					`Übersetzung fehlt: Bitte erstelle das Dokument 'Settings' für die Sprache '${lang}'.`
				);
			}),

			// Navigation (muss für jede Sprache existieren)
			client.getSingle('navigation', { lang }).catch(() => {
				throw error(
					404,
					`Übersetzung fehlt: Bitte erstelle das Dokument 'Navigation' für die Sprache '${lang}'.`
				);
			}),

			// Theme & Fonts (Global)
			client.getSingle('theme', { lang: '*' }).catch(() => null),
			client.getAllByType('font').catch(() => []),

			// Variablen & Preise (Global, optional) — cast: type generated after Prismic push
			(client as any).getSingle('variablen', { lang: '*' }).catch(() => null)
		]);

		const variables = buildTokenMap((variablenDoc as { data?: unknown })?.data);

		// Resolve font content relationships server-side so font names are always available
		// without relying on fetchLinks or CSS variable state.
		function resolveFontLink(link: any) {
			if (!link?.id) return link;
			const doc = fonts.find((f: any) => f.id === link.id);
			return doc ? { ...link, data: doc.data } : link;
		}
		const prismicTheme = theme && {
			...theme,
			data: {
				...theme.data,
				page_font: resolveFontLink(theme.data?.page_font),
				site_title_font: resolveFontLink(theme.data?.site_title_font),
				header_link_font: resolveFontLink(theme.data?.header_link_font)
			}
		};

		return {
			settings,
			navigation,
			prismicTheme,
			fonts,
			lang,
			mainLang,
			isMultilangActive,
			locales: allLocales,
			variables
		};
	} catch (e: any) {
		// Reiche SvelteKit-Errors (404 mit unseren Nachrichten) direkt weiter
		if (e.status) throw e;

		console.error('Layout Load Error:', e);
		throw error(500, { message: 'Technisches Problem beim Sprach-Setup im Layout.' });
	}
}
