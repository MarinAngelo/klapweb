import { theme } from '$lib/stores/theme';
import { get } from 'svelte/store';
// import { convertNumber } from '$lib/utils/convertNumber';

// Typisierung für die Prismic-Daten, falls nicht bereits vorhanden
interface PrismicThemeData {
	banner_top?: boolean;
	page_color?: string;
	page_bg_color?: string;
	page_font?: { data?: { name?: string } };
	page_link_color?: string;
	page_link_hover_color?: string;
	page_button_color?: string;
	page_button_bg_color?: string;
	page_button_hover_color?: string;
	page_button_hover_bg_color?: string;
	site_title_font_size?: number;
	site_subtitle_font_size?: number;
	header_font_size?: number;
	logo_height?: number;
	header_color?: string;
	header_bg_color?: string;
	header_link_color?: string;
	header_link_hover_color?: string;
	header_link_hover_bg_color?: string;
	header_link_font_size?: number;
	header_link_font?: { data?: { name?: string } };
	footer_color?: string;
	footer_bg_color?: string;
	footer_font_size_top_bar?: number;
	footer_font_size_button_bar?: number;
	footer_link_color?: string;
	footer_link_hover_color?: string;
	page_link_active_color?: string;
	page_link_visited_color?: string;
	button_active_color?: string;
	button_visited_color?: string;
	button_active_bg_color?: string;
	button_border_radius?: number;
	button_padding_y?: number;
	button_padding_x?: number;
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

	const bannerTop = prismicThemeData.banner_top === true;
	const pageColor = prismicThemeData.page_color || getCssVar('--page-color');
	const pageBgColor = prismicThemeData.page_bg_color || getCssVar('--page-bg-color');
	const pageFont = prismicThemeData.page_font?.data?.name || getCssVar('--page-font');
	const pageLinkColor = prismicThemeData.page_link_color || getCssVar('--page-link-color');
	const pageLinkHoverColor = prismicThemeData.page_link_hover_color || getCssVar('--page-link-hover-color');
	const pageButtonColor = prismicThemeData.page_button_color || getCssVar('--page-button-color');
	const pageButtonBgColor = prismicThemeData.page_button_bg_color || getCssVar('--page-button-bg-color');
	const pageButtonHoverColor = prismicThemeData.page_button_hover_color || getCssVar('--page-button-hover-color');
	const pageButtonHoverBgColor = prismicThemeData.page_button_hover_bg_color || getCssVar('--page-button-hover-bg-color');
	const siteTitleFontSize = prismicThemeData.site_title_font_size || parseFloat(getCssVar('--site-title-font-size'));
	const siteSubtitleFontSize = prismicThemeData.site_subtitle_font_size || parseFloat(getCssVar('--site-sub-title-font-size'));
	const headerFontSize = prismicThemeData.header_font_size || parseFloat(getCssVar('--header-font-size'));
	const logoHeight = prismicThemeData.logo_height || parseFloat(getCssVar('--logo-height'));
	const headerColor = prismicThemeData.header_color || getCssVar('--header-color');
	const headerBgColor = prismicThemeData.header_bg_color || getCssVar('--header-bg-color');
	const headerLinkColor = prismicThemeData.header_link_color || getCssVar('--header-link-color');
	const headerLinkHoverColor = prismicThemeData.header_link_hover_color || getCssVar('--header-link-hover-color');
	const headerLinkHoverBgColor = prismicThemeData.header_link_hover_bg_color || getCssVar('--header-link-hover-bg-color');
	const headerLinkFontSize = prismicThemeData.header_link_font_size || parseFloat(getCssVar('--header-link-font-size'));
	const headerLinkFont = prismicThemeData.header_link_font?.data?.name || getCssVar('--header-link-font');
	const footerColor = prismicThemeData.footer_color || getCssVar('--footer-color');
	const footerBgColor = prismicThemeData.footer_bg_color || getCssVar('--footer-bg-color');
	const footerFontSizeTopBar = prismicThemeData.footer_font_size_top_bar || parseFloat(getCssVar('--footer-font-size-top-bar'));
	const footerFontSizeButtonBar = prismicThemeData.footer_font_size_button_bar || parseFloat(getCssVar('--footer-font-size-button-bar'));
	const footerLinkColor = prismicThemeData.footer_link_color || getCssVar('--footer-link-color');
	const footerLinkHoverColor = prismicThemeData.footer_link_hover_color || getCssVar('--footer-link-hover-color');
	const pageLinkActiveColor = prismicThemeData.page_link_active_color || getCssVar('--page-link-active-color');
	const pageLinkVisitedColor = prismicThemeData.page_link_visited_color || getCssVar('--page-link-visited-color');

	
	theme.update((t) => ({
		...t,
		bannerTop,
		pageColor,
		pageBgColor,
		pageFont,
		pageLinkColor,
		pageLinkHoverColor,
		pageButtonColor,
		pageButtonBgColor,
		pageButtonHoverColor,
		pageButtonHoverBgColor,
		siteTitleFontSize,
		siteSubtitleFontSize,
		headerFontSize,
		logoHeight,
		headerColor,
		headerBgColor,
		headerLinkColor,
		headerLinkHoverColor,
		headerLinkHoverBgColor,
		headerLinkFontSize,
		headerLinkFont,
		footerColor,
		footerBgColor,
		footerFontSizeTopBar,
		footerFontSizeButtonBar,
		footerLinkColor,
		footerLinkHoverColor,
		pageLinkActiveColor,
		pageLinkVisitedColor
	}));

	// NEU: Werte auch als CSS-Variablen setzen
	if (typeof window !== 'undefined') {
		const root = document.documentElement;
		root.style.setProperty('--page-color', pageColor);
		root.style.setProperty('--page-bg-color', pageBgColor);
		root.style.setProperty('--page-font', pageFont);
		root.style.setProperty('--page-link-color', pageLinkColor);
		root.style.setProperty('--page-link-hover-color', pageLinkHoverColor);
		root.style.setProperty('--page-button-color', pageButtonColor);
		root.style.setProperty('--page-button-bg-color', pageButtonBgColor);
		root.style.setProperty('--page-button-hover-color', pageButtonHoverColor);
		root.style.setProperty('--page-button-hover-bg-color', pageButtonHoverBgColor);
		root.style.setProperty('--site-title-font-size', siteTitleFontSize.toString());
		root.style.setProperty('--site-sub-title-font-size', siteSubtitleFontSize.toString());
		root.style.setProperty('--header-font-size', headerFontSize.toString());
		root.style.setProperty('--logo-height', logoHeight.toString());
		root.style.setProperty('--header-color', headerColor);
		root.style.setProperty('--header-bg-color', headerBgColor);
		// headerBgOpacity: Verwende Theme Store oder CSS-Fallback
		const currentHeaderBgOpacity = get(theme).headerBgOpacity || parseFloat(getCssVar('--header-bg-opacity'));
		root.style.setProperty('--header-bg-opacity', currentHeaderBgOpacity.toString());
		root.style.setProperty('--header-link-color', headerLinkColor);
		root.style.setProperty('--header-link-hover-color', headerLinkHoverColor);
		root.style.setProperty('--header-link-hover-bg-color', headerLinkHoverBgColor);
		root.style.setProperty('--header-link-font-size', headerLinkFontSize.toString());
		root.style.setProperty('--header-link-font', headerLinkFont);
		root.style.setProperty('--footer-color', footerColor);
		root.style.setProperty('--footer-bg-color', footerBgColor);
		root.style.setProperty('--footer-font-size-top-bar', footerFontSizeTopBar.toString());
		root.style.setProperty('--footer-font-size-button-bar', footerFontSizeButtonBar.toString());
		root.style.setProperty('--footer-link-color', footerLinkColor);
		root.style.setProperty('--footer-link-hover-color', footerLinkHoverColor);
		root.style.setProperty('--page-link-active-color', pageLinkActiveColor);
		root.style.setProperty('--page-link-visited-color', pageLinkVisitedColor);
	}
}
