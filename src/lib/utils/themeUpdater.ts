import { theme } from '$lib/stores/theme';
import { get } from 'svelte/store';
import { presetFontUrls } from '$lib/utils/presetFonts';
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
	site_title_font?: { data?: { name?: string } };
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
	no_margin_top?: boolean;
	page_link_active_color?: string;
	page_link_visited_color?: string;
	highlight_color?: string;
	highlight_bg_color?: string;
	button_active_color?: string;
	button_visited_color?: string;
	button_active_bg_color?: string;
	button_border_radius?: number;
	button_padding_y?: number;
	button_padding_x?: number;
	container_width?: string;
	preset_font?: string;
	heading_opacity?: number;
	// CMS-konfigurierbare Button-Stile
	button_stile?: Array<{
		label?: string;
		color?: string;
		bg_color?: string;
		hover_color?: string;
		hover_bg_color?: string;
		icon?: string;
	}>;
	// CMS-konfigurierbare SVG-Icons
	svg_icons?: Array<{
		label?: string;
		svg_code?: string;
		image?: { url?: string; alt?: string };
	}>;
}

interface ThemeUpdateData {
	prismicTheme?: {
		data?: PrismicThemeData;
	};
	buttonStilDocs?: Array<any>;
	iconDocs?: Array<any>;
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
	const pageFont =
		prismicThemeData.page_font?.data?.name ||
		prismicThemeData.preset_font ||
		getCssVar('--page-font');
	const pageLinkColor = prismicThemeData.page_link_color || getCssVar('--page-link-color');
	const pageLinkHoverColor =
		prismicThemeData.page_link_hover_color || getCssVar('--page-link-hover-color');
	const pageButtonColor = prismicThemeData.page_button_color || getCssVar('--page-button-color');
	const pageButtonBgColor =
		prismicThemeData.page_button_bg_color || getCssVar('--page-button-bg-color');
	const pageButtonHoverColor =
		prismicThemeData.page_button_hover_color || getCssVar('--page-button-hover-color');
	const pageButtonHoverBgColor =
		prismicThemeData.page_button_hover_bg_color || getCssVar('--page-button-hover-bg-color');
	const siteTitleFontSize =
		prismicThemeData.site_title_font_size || parseFloat(getCssVar('--site-title-font-size'));
	const siteTitleFont =
		prismicThemeData.site_title_font?.data?.name || getCssVar('--site-title-font');
	const siteSubtitleFontSize =
		prismicThemeData.site_subtitle_font_size || parseFloat(getCssVar('--site-sub-title-font-size'));
	const headerFontSize =
		prismicThemeData.header_font_size || parseFloat(getCssVar('--header-font-size'));
	const logoHeight = prismicThemeData.logo_height || parseFloat(getCssVar('--logo-height'));
	const headerColor = prismicThemeData.header_color || getCssVar('--header-color');
	const headerBgColor = prismicThemeData.header_bg_color || getCssVar('--header-bg-color');
	const headerLinkColor = prismicThemeData.header_link_color || getCssVar('--header-link-color');
	const headerLinkHoverColor =
		prismicThemeData.header_link_hover_color || getCssVar('--header-link-hover-color');
	const headerLinkHoverBgColor =
		prismicThemeData.header_link_hover_bg_color || getCssVar('--header-link-hover-bg-color');
	const headerLinkFontSize =
		prismicThemeData.header_link_font_size || parseFloat(getCssVar('--header-link-font-size'));
	const headerLinkFont =
		prismicThemeData.header_link_font?.data?.name || getCssVar('--header-link-font');
	const footerColor = prismicThemeData.footer_color || getCssVar('--footer-color');
	const footerBgColor = prismicThemeData.footer_bg_color || getCssVar('--footer-bg-color');
	const footerFontSizeTopBar =
		prismicThemeData.footer_font_size_top_bar ||
		parseFloat(getCssVar('--footer-font-size-top-bar'));
	const footerFontSizeButtonBar =
		prismicThemeData.footer_font_size_button_bar ||
		parseFloat(getCssVar('--footer-font-size-button-bar'));
	const footerLinkColor = prismicThemeData.footer_link_color || getCssVar('--footer-link-color');
	const footerLinkHoverColor =
		prismicThemeData.footer_link_hover_color || getCssVar('--footer-link-hover-color');
	const noMarginTop = prismicThemeData.no_margin_top || false;
	const pageLinkActiveColor =
		prismicThemeData.page_link_active_color || getCssVar('--page-link-active-color');
	const pageLinkVisitedColor =
		prismicThemeData.page_link_visited_color || getCssVar('--page-link-visited-color');
	const highlightColor = prismicThemeData.highlight_color || getCssVar('--highlight-color');
	const highlightBgColor = prismicThemeData.highlight_bg_color || getCssVar('--highlight-bg-color');

	const updateData = {
		...({} as any),
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
		siteTitleFont,
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
		noMarginTop,
		pageLinkActiveColor,
		pageLinkVisitedColor
	};


	theme.update((t) => ({
		...t,
		...updateData
	}));

	// Werte als CSS-Variablen setzen – nur wenn nicht leer, damit die
	// app.css-Kaskade (z.B. --page-button-color: var(--page-link-color)) greift
	if (typeof window !== 'undefined') {
		const root = document.documentElement;
		const set = (prop: string, value: string | number) => {
			const v = String(value).trim();
			if (v) root.style.setProperty(prop, v);
		};
		set('--page-color', pageColor);
		set('--page-bg-color', pageBgColor);
		set('--page-font', pageFont);
		set('--page-link-color', pageLinkColor);
		set('--page-link-hover-color', pageLinkHoverColor);
		set('--page-button-color', pageButtonColor);
		set('--page-button-bg-color', pageButtonBgColor);
		set('--page-button-hover-color', pageButtonHoverColor);
		set('--page-button-hover-bg-color', pageButtonHoverBgColor);
		set('--site-title-font-size', siteTitleFontSize);
		set('--site-title-font', siteTitleFont);
		set('--site-sub-title-font-size', siteSubtitleFontSize);
		set('--header-font-size', headerFontSize);
		set('--logo-height', logoHeight);
		set('--header-color', headerColor);
		set('--header-bg-color', headerBgColor);
		// headerBgOpacity: Verwende Theme Store oder CSS-Fallback
		const currentHeaderBgOpacity =
			get(theme).headerBgOpacity || parseFloat(getCssVar('--header-bg-opacity'));
		set('--header-bg-opacity', currentHeaderBgOpacity);
		set('--header-link-color', headerLinkColor);
		set('--header-link-hover-color', headerLinkHoverColor);
		set('--header-link-hover-bg-color', headerLinkHoverBgColor);
		set('--header-link-font-size', headerLinkFontSize);
		set('--header-link-font', headerLinkFont);
		set('--footer-color', footerColor);
		set('--footer-bg-color', footerBgColor);
		set('--footer-font-size-top-bar', footerFontSizeTopBar);
		set('--footer-font-size-button-bar', footerFontSizeButtonBar);
		set('--footer-link-color', footerLinkColor);
		set('--footer-link-hover-color', footerLinkHoverColor);
		set('--page-link-active-color', pageLinkActiveColor);
		set('--page-link-visited-color', pageLinkVisitedColor);
		set('--highlight-color', highlightColor);
		set('--highlight-bg-color', highlightBgColor);

		// Button-Stile aus button_stil Custom Type Dokumenten
		const buttonStile = (data.buttonStilDocs ?? []).map((doc: any) => {
			const slug: string = doc.uid;
			if (doc.data.color) set(`--btn-${slug}-color`, doc.data.color);
			if (doc.data.bg_color) set(`--btn-${slug}-bg`, doc.data.bg_color);
			if (doc.data.hover_color) set(`--btn-${slug}-hover-color`, doc.data.hover_color);
			if (doc.data.hover_bg_color) set(`--btn-${slug}-hover-bg`, doc.data.hover_bg_color);
			return {
				name: slug,
				label: doc.data.name ?? slug,
				color: doc.data.color ?? undefined,
				bg_color: doc.data.bg_color ?? undefined,
				hover_color: doc.data.hover_color ?? undefined,
				hover_bg_color: doc.data.hover_bg_color ?? undefined,
				icon: doc.data.icon?.uid ?? undefined
			};
		});
		theme.update((t) => ({ ...t, buttonStile }));

		// Icons aus icon Custom Type Dokumenten
		const svgIcons = (data.iconDocs ?? []).map((doc: any) => ({
			name: doc.uid,
			label: doc.data.name ?? doc.uid,
			svg_code: doc.data.svg_code ?? undefined,
			image_url: doc.data.image?.url ?? undefined,
			image_alt: doc.data.image?.alt ?? undefined
		}));
		theme.update((t) => ({ ...t, svgIcons }));

		if (
			prismicThemeData.heading_opacity !== undefined &&
			prismicThemeData.heading_opacity !== null
		) {
			root.style.setProperty(
				'--heading-opacity',
				(prismicThemeData.heading_opacity / 100).toString()
			);
		}

		const containerWidthMap: Record<string, string> = {
			Schmal: '48rem',
			Normal: '56rem',
			Standard: '72rem',
			Weit: '80rem',
			'Sehr weit': '96rem'
		};
		const containerWidth = containerWidthMap[prismicThemeData.container_width ?? ''] ?? '72rem';
		root.style.setProperty('--container-max-width', containerWidth);

		const presetFontUrl = prismicThemeData.preset_font
			? (presetFontUrls[prismicThemeData.preset_font] ?? null)
			: null;
		const existingLink = document.querySelector('link[data-theme-preset-font]');
		if (existingLink) existingLink.remove();
		if (presetFontUrl && !prismicThemeData.page_font?.data?.name) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = presetFontUrl;
			link.dataset.themePresetFont = '1';
			document.head.appendChild(link);
		}
	}
}
