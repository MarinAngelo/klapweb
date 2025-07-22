import { theme } from '$lib/stores/theme';
import { convertNumber } from '$lib/utils';

// Typisierung für die Prismic-Daten, falls nicht bereits vorhanden
interface PrismicThemeData {
	header_bg_opacity?: number;
	banner_top?: boolean;
	header_bg_color?: string;
	header_color?: string;
	header_link_color?: string;
	header_link_hover_color?: string;
	page_link_active_color?: string;
	page_link_visited_color?: string;
	footer_bg_color?: string;
	footer_color?: string;
	page_color?: string;
	page_bg_color?: string;
	page_link_color?: string;
	page_link_hover_color_bg?: string;
	page_link_hover_color_text?: string;
	nav_font?: string;
	body_font?: string;
	// Füge hier weitere relevante Felder aus deinen Prismic-Daten hinzu
}

interface ThemeUpdateData {
	prismicTheme?: {
		data?: PrismicThemeData;
	};
	// Füge hier weitere Daten hinzu, die für die Theme-Aktualisierung benötigt werden
}

// Funktion zum Auslesen einer CSS-Variable
// Stellt sicher, dass dies nur im Browser ausgeführt wird (für SSR wichtig)
const getCssVar = (name: string): string => {
	if (typeof window !== 'undefined' && document.documentElement) {
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	}
	return ''; // Fallback für SSR (Server-Side Rendering)
};

export function updateTheme(data: ThemeUpdateData): void {
	const prismicThemeData = data.prismicTheme?.data;

	if (!prismicThemeData) {
		// Handle the case where prismicThemeData is not available
		console.warn('Prismic theme data is missing, theme will not be updated from Prismic.');
		return;
	}

	const headerBgOpacity = convertNumber(prismicThemeData.header_bg_opacity ?? 99) || 0.99;
	const bannerTop = prismicThemeData.banner_top ?? false;

	const headerBgColor = prismicThemeData.header_bg_color || getCssVar('--header-bg-color');
	const headerColor = prismicThemeData.header_color || getCssVar('--header-color');
	const headerLinkColor = prismicThemeData.header_link_color || getCssVar('--header-link-color');
	const headerLinkHoverColor =
		prismicThemeData.header_link_hover_color || getCssVar('--header-link-hover-color');
	const pageLinkActiveColor =
		prismicThemeData.page_link_active_color || getCssVar('--page-link-active-color');
	const pageLinkVisitedColor =
		prismicThemeData.page_link_visited_color || getCssVar('--page-link-visited-color');
	const footerBgColor = prismicThemeData.footer_bg_color || getCssVar('--footer-bg-color');
	const footerColor = prismicThemeData.footer_color || getCssVar('--footer-color');
	const pageColor = prismicThemeData.page_color || getCssVar('--page-color');
	const pageBgColor = prismicThemeData.page_bg_color || getCssVar('--page-bg-color');
	const pageLinkColor = prismicThemeData.page_link_color || getCssVar('--page-link-color');
	const pageLinkHoverColorBg =
		prismicThemeData.page_link_hover_color_bg || getCssVar('--page-link-hover-color-bg');
	const pageLinkHoverColorText =
		prismicThemeData.page_link_hover_color_text || getCssVar('--page-link-hover-color-text');
	const navFont = prismicThemeData.nav_font || getCssVar('--nav-font').replace(/'/g, '');
	const bodyFont = prismicThemeData.body_font || getCssVar('--body-font').replace(/'/g, '');

	theme.update((t) => ({
		...t,
		headerColor,
		headerBgColor,
		headerLinkColor,
		headerLinkHoverColor,
		headerBgOpacity,
		bannerTop,
		footerBgColor,
		footerColor,
		pageColor,
		pageBgColor,
		pageLinkColor,
		pageLinkHoverColorBg,
		pageLinkHoverColorText,
		pageLinkActiveColor,
		pageLinkVisitedColor,
		navFont,
		bodyFont
	}));
}
