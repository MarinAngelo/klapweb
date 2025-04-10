import { writable } from 'svelte/store';

export const theme = writable({
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
    pageLinkHoverColor: '', 
    pageLinkActiveColor: '', 
    pageLinkVisitedColor: '', 
});
