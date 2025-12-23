import { writable } from 'svelte/store';

export const THEME_DEFAULTS = {
	// Globale Defaults
	imageOverlayOpacity: 60, // Standardwert für Bild-Overlays im gleichem Format wie vom Prismic geliefert
    // Aus Slices/Titelbereich/index.svelte
	bannerTop: false,
	headerBgOpacity: 1,
    // Aus Custom Type "Theme" hier keine expliziten Default-Werte, da diese aus CSS-Variablen geholt werden
	headerColor: '',
	headerLinkColor: '',
	headerLinkHoverColor: '',
	headerLinkHoverBgColor: '',
	headerLinkActiveColor: '',
	headerLinkVisitedColor: '',
	headerBgColor: '',
	footerColor: '',
	footerLinkColor: '',
	footerLinkHoverColor: '',
	footerLinkActiveColor: '',
	footerLinkVisitedColor: '',
	footerBgColor: '',
	pageColor: '',
	pageBgColor: '',
	pageLinkColor: '',
	pageLinkHoverColor: '',
	pageLinkActiveColor: '',
	pageLinkVisitedColor: '',
	bodyFont: '',
	navFont: '',
	buttonColor: '',
	buttonHoverColor: '',
	buttonBgColor: '',
	buttonHoverBgColor: '',
	buttonActiveColor: '',
	buttonVisitedColor: '',
	buttonActiveBgColor: '',
	buttonBorderRadius: 0,
	buttonPaddingY: 0,
	buttonPaddingX: 0,
};

export const theme = writable({ ...THEME_DEFAULTS });
