import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';
import { buildTokenMap } from '$lib/utils/buildTokenMap.server';

// Repo-Infos (Sprachen) ändern sich selten — einmal pro Prozess cachen.
// Eliminiert einen seriellen API-Call (~300–500 ms) bei jedem Page-Request.
let _repoCache: { mainLang: string; allLocales: string[]; at: number } | null = null;
const REPO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minuten

async function getRepoInfo(client: ReturnType<typeof createClient>) {
	const now = Date.now();
	if (_repoCache && now - _repoCache.at < REPO_CACHE_TTL_MS) return _repoCache;
	const repo = await client.getRepository();
	const mainLang =
		repo.languages.find((l: any) => l.is_master === true)?.id ?? repo.languages[0].id;
	const allLocales = repo.languages.map((l: any) => l.id);
	_repoCache = { mainLang, allLocales, at: now };
	return _repoCache;
}

export const prerender = 'auto';

export async function load({ params, fetch, cookies, url, locals }) {
	// Preview-Route: nur Slice-Rendering, keine Prismic-Daten nötig
	if (url.pathname.startsWith('/preview/')) {
		return {};
	}

	const client = createClient({ fetch, cookies });

	try {
		// 1. Repo-Infos (gecacht – kein serieller API-Call mehr bei jedem Request)
		const { mainLang, allLocales } = await getRepoInfo(client);

		// 2. Sprach-Ermittlung der aktuellen Route
		const segments = url.pathname.split('/').filter(Boolean);
		const firstSegment = segments[0];
		const lang = allLocales.includes(firstSegment) ? firstSegment : params.lang || mainLang;

		// 3. Alle globalen Daten in einem einzigen parallelen Block laden.
		//    Master-Settings werden nur als Extra-Call geladen wenn Sprache ≠ Master.
		const [settings, navigation, themes, fonts, variablenDoc, masterSettingsOrNull] =
			await Promise.all([
				client.getSingle('settings', { lang }).catch(() => {
					throw error(
						404,
						`Übersetzung fehlt: Bitte erstelle das Dokument 'Settings' für die Sprache '${lang}'.`
					);
				}),
				client.getSingle('navigation', { lang }).catch(() => {
					throw error(
						404,
						`Übersetzung fehlt: Bitte erstelle das Dokument 'Navigation' für die Sprache '${lang}'.`
					);
				}),
				client.getAllByType('theme', { lang: '*' }).catch(() => []),
				client.getAllByType('font').catch(() => []),
				(client as any).getSingle('variablen', { lang: '*' }).catch(() => null),
				// Master-Settings nur laden wenn Route-Sprache vom Master abweicht
				lang !== mainLang
					? client.getSingle('settings', { lang: mainLang }).catch(() => null)
					: Promise.resolve(null)
			]);

		// Bei gleicher Sprache sind Settings == baseSettings; sonst separater Call
		const baseSettings = lang !== mainLang ? masterSettingsOrNull : settings;
		if (!baseSettings) {
			throw error(
				404,
				`Kritisches Dokument fehlt: Bitte erstelle das Dokument 'Settings' für die Hauptsprache '${mainLang}' in Prismic.`
			);
		}

		const isMultilangActive = baseSettings.data?.show_language_switcher ?? false;
		const userBackendActive = (baseSettings.data as any)?.user_backend_active ?? false;
		const chatActive = (baseSettings.data as any)?.chat_active ?? false;
		const chatBotName = (baseSettings.data as any)?.chat_bot_name || 'Assistent';
		const chatGreeting = (baseSettings.data as any)?.chat_greeting || 'Hallo! Wie kann ich helfen?';
		if (!isMultilangActive && lang !== mainLang) {
			throw error(404, `Sprache '${lang}' ist zurzeit deaktiviert.`);
		}

		const variables = buildTokenMap((variablenDoc as { data?: unknown })?.data);

		// Aktives Theme bestimmen (Feld activ == true)
		const activeTheme = Array.isArray(themes) ? themes.find((t) => t.data?.activ === true) : null;

		// Resolve font content relationships server-side so font names are always available
		// without relying on fetchLinks or CSS variable state.
		function resolveFontLink(link: any) {
			if (!link?.id) return link;
			const doc = fonts.find((f: any) => f.id === link.id);
			return doc ? { ...link, data: doc.data } : link;
		}
		const prismicTheme = activeTheme && {
			...activeTheme,
			data: {
				...activeTheme.data,
				page_font: resolveFontLink(activeTheme.data?.page_font),
				site_title_font: resolveFontLink(activeTheme.data?.site_title_font),
				header_link_font: resolveFontLink(activeTheme.data?.header_link_font)
			}
		};

		// SSR-Theme-CSS in locals setzen – wird via hooks.server.ts injiziert
		if (prismicTheme?.data) {
			const d = prismicTheme.data;
			const headingOpacity =
				d.heading_opacity != null ? (d.heading_opacity / 100).toFixed(2) : null;
			const pageFont = (d as any).page_font?.data?.name || (d as any).preset_font;
			const siteTitleFont = (d as any).site_title_font?.data?.name;
			const headerLinkFont = (d as any).header_link_font?.data?.name;
			const containerWidthMap: Record<string, string> = {
				Schmal: '48rem',
				Normal: '56rem',
				Standard: '72rem',
				Weit: '80rem',
				'Sehr weit': '96rem'
			};
			const containerMaxWidth = containerWidthMap[(d as any).container_width ?? ''] ?? null;
			const vars = [
				// Seite – Farben
				d.page_color && `--page-color:${d.page_color}`,
				d.page_bg_color && `--page-bg-color:${d.page_bg_color}`,
				d.page_link_color && `--page-link-color:${d.page_link_color}`,
				d.page_link_hover_color && `--page-link-hover-color:${d.page_link_hover_color}`,
				(d as any).page_button_color && `--page-button-color:${(d as any).page_button_color}`,
				(d as any).page_button_bg_color &&
					`--page-button-bg-color:${(d as any).page_button_bg_color}`,
				(d as any).page_button_hover_color &&
					`--page-button-hover-color:${(d as any).page_button_hover_color}`,
				(d as any).page_button_hover_bg_color &&
					`--page-button-hover-bg-color:${(d as any).page_button_hover_bg_color}`,
				(d as any).page_link_active_color &&
					`--page-link-active-color:${(d as any).page_link_active_color}`,
				(d as any).page_link_visited_color &&
					`--page-link-visited-color:${(d as any).page_link_visited_color}`,
				// Seite – Schrift & Layout
				pageFont && `--page-font:${pageFont}`,
				containerMaxWidth && `--container-max-width:${containerMaxWidth}`,
				// Kopfzeile
				(d as any).site_title_font_size &&
					`--site-title-font-size:${(d as any).site_title_font_size}`,
				siteTitleFont && `--site-title-font:${siteTitleFont}`,
				(d as any).site_subtitle_font_size &&
					`--site-sub-title-font-size:${(d as any).site_subtitle_font_size}`,
				(d as any).header_font_size && `--header-font-size:${(d as any).header_font_size}`,
				(d as any).logo_height && `--logo-height:${(d as any).logo_height}`,
				d.header_color && `--header-color:${d.header_color}`,
				d.header_bg_color && `--header-bg-color:${d.header_bg_color}`,
				(d as any).header_link_color && `--header-link-color:${(d as any).header_link_color}`,
				(d as any).header_link_hover_color &&
					`--header-link-hover-color:${(d as any).header_link_hover_color}`,
				(d as any).header_link_hover_bg_color &&
					`--header-link-hover-bg-color:${(d as any).header_link_hover_bg_color}`,
				(d as any).header_link_font_size &&
					`--header-link-font-size:${(d as any).header_link_font_size}`,
				headerLinkFont && `--header-link-font:${headerLinkFont}`,
				// Fußzeile
				d.footer_color && `--footer-color:${d.footer_color}`,
				d.footer_bg_color && `--footer-bg-color:${d.footer_bg_color}`,
				(d as any).footer_font_size_top_bar &&
					`--footer-font-size-top-bar:${(d as any).footer_font_size_top_bar}`,
				(d as any).footer_font_size_button_bar &&
					`--footer-font-size-button-bar:${(d as any).footer_font_size_button_bar}`,
				(d as any).footer_link_color && `--footer-link-color:${(d as any).footer_link_color}`,
				(d as any).footer_link_hover_color &&
					`--footer-link-hover-color:${(d as any).footer_link_hover_color}`,
				// Sonstiges
				headingOpacity && `--heading-opacity:${headingOpacity}`
			].filter(Boolean);
			if (vars.length) locals.themeColorsCss = vars.join(';');
		}

		return {
			settings,
			navigation,
			prismicTheme,
			fonts,
			lang,
			mainLang,
			isMultilangActive,
			userBackendActive,
			chatActive,
			chatBotName,
			chatGreeting,
			locales: allLocales,
			variables,
			user: locals.user ?? null
		};
	} catch (e: any) {
		// Reiche SvelteKit-Errors (404 mit unseren Nachrichten) direkt weiter
		if (e.status) throw e;

		console.error('Layout Load Error:', e);
		throw error(500, { message: 'Technisches Problem beim Sprach-Setup im Layout.' });
	}
}
