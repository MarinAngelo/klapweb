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
 * MAPPING FÜR STATISCHE ROUTEN
 * Diese Pfade sind im Dateisystem fix hinterlegt (z.B. /src/routes/[[lang=lang]]/impressum).
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
	}
};

/**
 * Helper für die Footer-Links und statische Pfade.
 * Extrahiert den Sprachschlüssel (z.B. "de" aus "de-ch").
 */
export const getLangBase = (lang: string): string => {
	return lang?.split('-')[0] || 'de';
};
