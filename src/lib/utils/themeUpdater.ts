import { theme } from '$lib/stores/theme';
import { convertNumber } from '$lib/utils/convertNumber';

// Typisierung für die Prismic-Daten, falls nicht bereits vorhanden
interface PrismicThemeData {
	header_bg_opacity?: number;
	banner_top?: boolean;
	header_bg_color?: string;
	header_color?: string;
	header_link_color?: string;
	header_link_hover_color?: string;
	header_link_hover_bg_color?: string;
	page_color?: string;
	page_bg_color?: string;
	page_link_color?: string;
	page_link_hover_color?: string;
	page_link_active_color?: string;
	page_link_visited_color?: string;
	footer_bg_color?: string;
	footer_color?: string;
	footer_font_size_top_bar?: number;
	footer_font_size_button_bar?: number;
	nav_font?: string;
	body_font?: string;
	button_color?: string;
	button_bg_color?: string;
	button_hover_color?: string;
	button_hover_bg_color?: string;
	button_active_color?: string;
	button_visited_color?: string;
	button_active_bg_color?: string;
	button_border_radius?: number;
	button_padding_y?: number;
	button_padding_x?: number;
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

	const headerBgOpacity = convertNumber(prismicThemeData.header_bg_opacity ?? 0) || 0;
	const bannerTop = prismicThemeData.banner_top === true;
	const headerBgColor = prismicThemeData.header_bg_color || getCssVar('--header-bg-color');
	const headerColor = prismicThemeData.header_color || getCssVar('--header-color');
	const headerLinkColor = prismicThemeData.header_link_color || getCssVar('--header-link-color');
	const headerLinkHoverColor =
		prismicThemeData.header_link_hover_color || getCssVar('--header-link-hover-color');
	const headerLinkHoverBgColor =
		prismicThemeData.header_link_hover_bg_color || getCssVar('--header-link-hover-bg-color');
	const pageLinkActiveColor =
		prismicThemeData.page_link_active_color || getCssVar('--page-link-active-color');
	const pageLinkVisitedColor =
		prismicThemeData.page_link_visited_color || getCssVar('--page-link-visited-color');
	const footerBgColor = prismicThemeData.footer_bg_color || getCssVar('--footer-bg-color');
	const footerColor = prismicThemeData.footer_color || getCssVar('--footer-color');
	const pageColor = prismicThemeData.page_color || getCssVar('--page-color');
	const pageBgColor = prismicThemeData.page_bg_color || getCssVar('--page-bg-color');
	const pageLinkColor = prismicThemeData.page_link_color || getCssVar('--page-link-color');
	const pageLinkHoverColor =
		prismicThemeData.page_link_hover_color || getCssVar('--page-link-hover-color');
	const buttonColor = prismicThemeData.button_color || getCssVar('--button-color');
	const buttonHoverColor = prismicThemeData.button_hover_color || getCssVar('--button-hover-color');
	const buttonBgColor = prismicThemeData.button_bg_color || getCssVar('--button-bg-color');
	const buttonHoverBgColor =
		prismicThemeData.button_hover_bg_color || getCssVar('--button-hover-bg-color');
	const footerFontSizeTopBar = prismicThemeData.footer_font_size_top_bar || getCssVar('--footer-font-size-top-bar');
	const footerFontSizeButtonBar = prismicThemeData.footer_font_size_button_bar || getCssVar('--footer-font-size-button-bar');
	const bodyFont = prismicThemeData.body_font || getCssVar('--body-font').replace(/'/g, '');
	const navFont = prismicThemeData.nav_font || getCssVar('--nav-font').replace(/'/g, '');

	theme.update((t) => ({
		...t,
		headerColor,
		headerBgColor,
		headerLinkColor,
		headerLinkHoverColor,
		headerLinkHoverBgColor,
		headerBgOpacity,
		bannerTop,
		footerBgColor,
		footerColor,
		footerFontSizeTopBar,
		footerFontSizeButtonBar,
		pageColor,
		pageBgColor,
		pageLinkColor,
		pageLinkHoverColor,
		pageLinkActiveColor,
		pageLinkVisitedColor,
		navFont,
		bodyFont,
		buttonColor,
		buttonHoverColor,
		buttonBgColor,
		buttonHoverBgColor
	}));

	// NEU: Werte auch als CSS-Variablen setzen
	if (typeof window !== 'undefined') {
		const root = document.documentElement;
		root.style.setProperty('--header-bg-color', headerBgColor);
		root.style.setProperty('--header-color', headerColor);
		root.style.setProperty('--header-link-color', headerLinkColor);
		root.style.setProperty('--header-link-hover-color', headerLinkHoverColor);
		root.style.setProperty('--header-link-hover-bg-color', headerLinkHoverBgColor);
		root.style.setProperty('--footer-bg-color', footerBgColor);
		root.style.setProperty('--footer-color', footerColor);
		root.style.setProperty('--page-color', pageColor);
		root.style.setProperty('--page-bg-color', pageBgColor);
		root.style.setProperty('--page-link-color', pageLinkColor);
		root.style.setProperty('--page-link-hover-color', pageLinkHoverColor);
		root.style.setProperty('--page-link-active-color', pageLinkActiveColor);
		root.style.setProperty('--page-link-visited-color', pageLinkVisitedColor);
		root.style.setProperty('--nav-font', navFont);
		root.style.setProperty('--body-font', bodyFont);
		root.style.setProperty('--button-color', buttonColor);
		root.style.setProperty('--button-hover-color', buttonHoverColor);
		root.style.setProperty('--button-bg-color', buttonBgColor);
		root.style.setProperty('--button-hover-bg-color', buttonHoverBgColor);
	}
}
