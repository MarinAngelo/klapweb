import { getLangBase } from '$lib/i18n/i18n';

/**
 * Link to a static legal page (Datenschutz, Impressum, AGB) in the current language.
 * Main language gets no prefix, all other languages are prefixed with /{lang}.
 */
export function getLegalHref(
	lang: string | undefined,
	mainLang: string | undefined,
	deSlug: string,
	enSlug: string
): string {
	if (!lang) return '/';
	const targetSlug = getLangBase(lang) === 'en' ? enSlug : deSlug;
	const prefix = lang === mainLang ? '' : `/${lang}`;
	const path = `${prefix}/${targetSlug}`.replace(/\/+$/, '');
	return path || '/';
}
