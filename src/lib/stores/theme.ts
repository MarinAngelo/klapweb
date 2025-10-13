import { writable } from 'svelte/store';

export const THEME_DEFAULTS = {
    // Aus Slices/Titelbereich/index.svelte
	bannerTop: false,
	headerBgOpacity: 1,
    // Aus Custom Type "Theme" hier keine expliziten Default-Werte, da diese aus CSS-Variablen geholt werden
	headerColor: '',
	headerLinkColor: '',
	headerLinkHoverColor: '',
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
	pageLinkHoverColorBg: '',
	pageLinkHoverColorText: '',
	pageLinkActiveColor: '',
	pageLinkVisitedColor: '',
	bodyFont: '',
	navFont: '',
	buttonBgColor: ''
};

export const theme = writable({ ...THEME_DEFAULTS });
