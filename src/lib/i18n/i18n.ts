/**
 * ZENTRALE i18n KONFIGURATION
 */

/**
 * Hilfsmethode für SvelteKit-Matcher ([lang=lang]).
 * Akzeptiert dynamisch alle Sprachcodes im Format 'xx-xx' (z.B. de-de, en-gb, fr-fr).
 * Dies verhindert 404-Loops, wenn neue Sprachen in Prismic hinzugefügt werden.
 */
export const isLanguage = (param: string): param is string => {
	return /^[a-z]{2}-[a-z]{2}$/.test(param);
};

/**
 * MAPPING FÜR STATISCHE ROUTEN (rechtliche Seiten)
 * Eine einzige Route src/routes/[[lang=lang]]/[legal=legal] bedient alle Slugs (Matcher
 * src/params/legal.ts); der Key bestimmt den Inhalt (LegalPage.svelte).
 * Das Mapping nutzt die Sprach-Basis (de/en), um flexibel auf de-ch, de-de etc. zu reagieren.
 */
export const staticRoutes: Record<string, Record<string, string>> = {
	impressum: {
		de: 'impressum',
		en: 'legal-notice'
	},
	datenschutz: {
		de: 'datenschutzerklaerung',
		en: 'privacy-policy'
	},
	agb: {
		de: 'agb',
		en: 'terms-and-conditions'
	},
	haftungsausschluss: {
		de: 'haftungsausschluss',
		en: 'disclaimer'
	}
};

/** Key of a legal page slug in any language (e.g. 'legal-notice' → 'impressum'), or null */
export const legalPageKey = (slug: string): string | null =>
	Object.keys(staticRoutes).find((key) => Object.values(staticRoutes[key]).includes(slug)) ?? null;

/**
 * Helper für die Footer-Links und statische Pfade.
 * Extrahiert den Sprachschlüssel (z.B. "de" aus "de-ch").
 */
export const getLangBase = (lang: string): string => {
	return lang?.split('-')[0] || 'de';
};
