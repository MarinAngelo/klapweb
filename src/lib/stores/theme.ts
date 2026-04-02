import { writable } from 'svelte/store';

export interface ButtonStil {
	name: string;
	label?: string;
	color?: string;
	bg_color?: string;
	hover_color?: string;
	hover_bg_color?: string;
	icon?: string;
}

// Liest eine CSS-Variable aus dem DOM (nur client-seitig verfügbar)
function cssVar(name: string): string {
	if (typeof document === 'undefined') return '';
	// Erst inline style des <html>-Elements lesen (von hooks.server.ts gesetzt),
	// dann computed style (aus Stylesheets)
	const inline = document.documentElement.style.getPropertyValue(name).trim();
	if (inline) return inline;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export const THEME_DEFAULTS = {
	// Globale Defaults
	imageOverlayOpacity: 60, // Standardwert für Bild-Overlays im gleichem Format wie vom Prismic geliefert
	bannerTop: false, // Aus Slices/Titelbereich/index.svelte

	// Generelle Seitenfarben und Schriftarten (wie in app.css)
	pageColor: '',
	pageBgColor: '',
	pageFont: '',
	baseFontSizeMobile: 0,
	baseFontSizeDesktop: 0,
	pageLinkColor: '',

	// Button Farben (wie in app.css)
	pageLinkHoverColor: '',
	pageButtonColor: '',
	pageButtonBgColor: '',
	pageButtonHoverColor: '',
	pageButtonHoverBgColor: '',

	// Kopfzeile Farben (wie in app.css)
	siteTitleFontSize: 0,
	siteTitleFont: '',
	siteSubtitleFontSize: 0,
	headerFontSize: 0,
	logoHeight: 0,
	headerColor: '',
	headerBgColor: '',
	headerLinkColor: '',
	headerLinkHoverColor: '',
	headerLinkHoverBgColor: '',
	headerLinkFont: '',

	// Fußzeile Farben (wie in app.css)
	footerColor: '',
	footerBgColor: '',
	footerFontSizeTopBar: 0,
	footerFontSizeButtonBar: 0,
	footerLinkColor: '',
	footerLinkHoverColor: '',

	// Weitere Eigenschaften (nicht in app.css)
	headerLinkActiveColor: '',
	headerLinkVisitedColor: '',
	pageLinkActiveColor: '',
	pageLinkVisitedColor: '',
	buttonActiveColor: '',
	buttonVisitedColor: '',
	buttonActiveBgColor: '',
	buttonBorderRadius: 0,
	buttonPaddingY: 0,
	buttonPaddingX: 0,

	// Titelbereich Slice spezifisch
	headerBgOpacity: 1, // Default: voll deckend (wird aus Slice überschrieben)
	hideHeaderOnLoad: false,

	// CMS-konfigurierbare Button-Stile
	buttonStile: [] as ButtonStil[]
};

// Auf dem Client sofort mit den bereits gesetzten CSS-Variablen initialisieren
// (hooks.server.ts injiziert diese vor dem ersten Paint als <html style="...">)
const initialValues = {
	...THEME_DEFAULTS,
	// Seite – Farben
	pageColor: cssVar('--page-color'),
	pageBgColor: cssVar('--page-bg-color'),
	pageFont: cssVar('--page-font'),
	pageLinkColor: cssVar('--page-link-color'),
	pageLinkHoverColor: cssVar('--page-link-hover-color'),
	pageButtonColor: cssVar('--page-button-color'),
	pageButtonBgColor: cssVar('--page-button-bg-color'),
	pageButtonHoverColor: cssVar('--page-button-hover-color'),
	pageButtonHoverBgColor: cssVar('--page-button-hover-bg-color'),
	pageLinkActiveColor: cssVar('--page-link-active-color'),
	pageLinkVisitedColor: cssVar('--page-link-visited-color'),
	// Kopfzeile
	siteTitleFont: cssVar('--site-title-font'),
	siteTitleFontSize: parseFloat(cssVar('--site-title-font-size')) || 0,
	siteSubtitleFontSize: parseFloat(cssVar('--site-sub-title-font-size')) || 0,
	headerFontSize: parseFloat(cssVar('--header-font-size')) || 0,
	logoHeight: parseFloat(cssVar('--logo-height')) || 0,
	headerColor: cssVar('--header-color'),
	headerBgColor: cssVar('--header-bg-color'),
	headerLinkColor: cssVar('--header-link-color'),
	headerLinkHoverColor: cssVar('--header-link-hover-color'),
	headerLinkHoverBgColor: cssVar('--header-link-hover-bg-color'),
	headerLinkFont: cssVar('--header-link-font'),
	// Fußzeile
	footerColor: cssVar('--footer-color'),
	footerBgColor: cssVar('--footer-bg-color'),
	footerFontSizeTopBar: parseFloat(cssVar('--footer-font-size-top-bar')) || 0,
	footerFontSizeButtonBar: parseFloat(cssVar('--footer-font-size-button-bar')) || 0,
	footerLinkColor: cssVar('--footer-link-color'),
	footerLinkHoverColor: cssVar('--footer-link-hover-color'),
	// Buttons
	buttonBorderRadius: parseFloat(cssVar('--button-border-radius')) || 0,
	buttonPaddingY: parseFloat(cssVar('--button-padding-y')) || 0,
	buttonPaddingX: parseFloat(cssVar('--button-padding-x')) || 0
};

export const theme = writable(initialValues);
