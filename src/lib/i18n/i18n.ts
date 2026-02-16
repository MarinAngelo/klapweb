/**
 * ZENTRALE i18n KONFIGURATION
 */

// Alle im Projekt unterstützten Prismic-Sprachcodes
export const languages: string[] = ['en-us', 'de-ch'];

/**
 * Hilfsmethode für SvelteKit-Matcher ([lang=lang]),
 * um zu prüfen, ob ein URL-Segment ein gültiger Sprachcode ist.
 */
export const isLanguage = (param: string): param is string => {
	return languages.includes(param);
};

/**
 * MAPPING FÜR STATISCHE ROUTEN
 * Diese Pfade sind im Dateisystem fix hinterlegt (z.B. /src/routes/[[lang=lang]]/impressum).
 * Das Mapping sorgt dafür, dass die Links je nach Sprache korrekt generiert werden.
 */
export const staticRoutes: Record<string, Record<string, string>> = {
	impressum: {
		'de-ch': 'impressum',
		'en-us': 'legal-notice'
	},
	datenschutz: {
		'de-ch': 'datenschutzerklaerung',
		'en-us': 'privacy-policy'
	},
	agb: {
		'de-ch': 'agb',
		'en-us': 'terms-and-conditions'
	}
};
