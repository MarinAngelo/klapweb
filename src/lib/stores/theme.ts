import { writable } from 'svelte/store';

export const THEME_DEFAULTS = {
	bannerTop: false,
	headerColor: '',
	headerLinkColor: '',
	headerLinkHoverColor: '',
	headerLinkActiveColor: '',
	headerLinkVisitedColor: '',
	headerBgColor: '',
	headerBgOpacity: 1,
	footerColor: '',
	footerLinkColor: '',
	footerLinkHoverColor: '',
	footerLinkActiveColor: '',
	footerLinkVisitedColor: '',
	footerBgColor: '',
	footerBgOpacity: 1,
	pageColor: '',
	pageBgColor: '',
	pageBgOpacity: 1,
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
