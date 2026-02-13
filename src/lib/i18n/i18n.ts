/**
 * ZENTRALE KONFIGURATION
 * Hier definierst du alle Sprachen deines Projekts.
 * Wenn du eine Sprache hinzufügst oder entfernst, musst du es NUR HIER tun.
 */

// Definiere hier deine Prismic-Sprachcodes (Locales)
export const languages: string[] = ['de-ch', 'en-us'];

/**
 * Die Standard-Sprache (Master Language).
 * Wir nehmen automatisch das erste Element aus dem Array.
 */
export const defaultLang = languages[0];

/**
 * Hilfsmethode für SvelteKit-Matcher und Server-Hooks,
 * um zu prüfen, ob eine URL einen gültigen Sprachcode enthält.
 */
export const isLanguage = (param: string): param is string => {
	return languages.includes(param);
};

/**
 * MAPPING FÜR STATISCHE ROUTEN
 * Hier definierst du die Verknüpfung der Pfade, die nicht im CMS liegen.
 */
export const staticRoutes: Record<string, Record<string, string>> = {
    'impressum': {
        'de-ch': 'impressum',
        'en-us': 'legal-notice'
    },
    'datenschutz': {
        'de-ch': 'datenschutzerklaerung',
        'en-us': 'privacy-policy'
    },
    'agb': {
        'de-ch': 'agb',
        'en-us': 'terms-and-conditions'
    }
}; 
