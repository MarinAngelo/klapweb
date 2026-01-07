import { writable } from 'svelte/store';

export const THEME_DEFAULTS = {
	// Globale Defaults
	imageOverlayOpacity: 60, // Standardwert für Bild-Overlays im gleichem Format wie vom Prismic geliefert
    // Aus Slices/Titelbereich/index.svelte
	bannerTop: false,
    // Aus Custom Type "Theme" hier keine expliziten Default-Werte, da diese aus CSS-Variablen geholt werden
	pageColor: '',
	pageBgColor: '',
	pageFont: '',
	baseFontSizeMobile: 0,
	baseFontSizeDesktop: 0,
	headerColor: '',
	headerLinkFontSize: 0,
	headerLinkColor: '',
	headerLinkHoverColor: '',
	headerLinkHoverBgColor: '',
	headerLinkActiveColor: '',
	headerLinkVisitedColor: '',
	headerBgColor: '',
	headerBgOpacity: 0,
	footerColor: '',
	footerBgColor: '',
	footerLinkColor: '',
	footerLinkHoverColor: '',
	footerFontSizeTopBar: 0,
	footerFontSizeButtonBar: 0,
	pageLinkColor: '',
	pageLinkHoverColor: '',
	pageLinkActiveColor: '',
	pageLinkVisitedColor: '',
	headerLinkFont: '',
	pageButtonColor: '',
	pageButtonHoverColor: '',
	pageButtonBgColor: '',
	pageButtonHoverBgColor: '',
	buttonActiveColor: '',
	buttonVisitedColor: '',
	buttonActiveBgColor: '',
	buttonBorderRadius: 0,
	buttonPaddingY: 0,
	buttonPaddingX: 0,
	siteTitleFontSize: 0,
	siteSubtitleFontSize: 0,
	logoHeight: 0,
};

export const theme = writable({ ...THEME_DEFAULTS });
