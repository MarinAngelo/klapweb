import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Language the visitor chose last (language switcher or a page under /<locale>/…),
 * kept in the browser so header, footer and UI texts stay in that language
 * on pages without a translation.
 * Registered as functional service "language" in consent/services.ts.
 */

const STORAGE_KEY = 'klap_lang';

function load(): string | null {
	if (!browser) return null;
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

export const preferredLang = writable<string | null>(load());

preferredLang.subscribe((value) => {
	if (!browser) return;
	try {
		if (value) localStorage.setItem(STORAGE_KEY, value);
		else localStorage.removeItem(STORAGE_KEY);
	} catch {
		// storage blocked → preference lasts for this visit only
	}
});

/** Effective UI language of the current page (set by the root layout) */
export const uiLang = writable<string | null>(null);

/** Paths that already showed the "no translation" notice in this visit (error page redirect, layout) */
export const translationNoticeShown = new Set<string>();
