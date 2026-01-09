import { writable } from 'svelte/store';

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
};

export const theme = writable({ ...THEME_DEFAULTS });
