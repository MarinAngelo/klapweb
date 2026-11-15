import { derived, writable } from 'svelte/store';
import { resolveLinkHref } from '$lib/utils/documentLinks';

/**
 * Language context for internal links, set by the root layout:
 * lang = language the visitor is viewing (incl. remembered language), mainLang, locales.
 */
export const linkContext = writable<{ lang: string; mainLang: string; locales: string[] }>({
	lang: '',
	mainLang: '',
	locales: []
});

/** $linkHref(field) → href with document-link URL and /<lang> prefix (see resolveLinkHref) */
export const linkHref = derived(
	linkContext,
	(ctx) => (field: unknown) => resolveLinkHref(field, ctx.lang, ctx.mainLang, ctx.locales)
);
