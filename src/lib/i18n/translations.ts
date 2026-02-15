/**
 * Zentrale Übersetzungsdatei
 * Key: Immer der deutsche Text (de-ch)
 * Values: Objekt mit den jeweiligen Übersetzungen
 */
export const translations: Record<string, Record<string, string>> = {
	'Mehr erfahren': {
		'de-ch': 'Mehr erfahren',
		'en-us': 'Learn more'
	},
	'Seite nicht gefunden': {
		'de-ch': 'Seite nicht gefunden',
		'en-us': 'Page not found'
	},
	'Diese Seite existiert in der gewählten Sprache leider noch nicht.': {
		'de-ch': 'Diese Seite existiert in der gewählten Sprache leider noch nicht.',
		'en-us': 'This page is not available in the selected language yet.'
	},
	'Zurück zur Hauptseite': {
		'de-ch': 'Zurück zur Hauptseite',
		'en-us': 'Back to main page'
	},
	'Automatische Weiterleitung in': {
		'de-ch': 'Automatische Weiterleitung in',
		'en-us': 'Redirecting in'
	}
};

/**
 * Die Helper-Funktion für Logik-Teile (Vorschlag 1)
 * Nutzt den Key als Fallback, falls keine Übersetzung existiert.
 */
export function t(key: string, lang: string): string {
	const entry = translations[key];
	if (!entry) {
		// Falls wir mal vergessen, einen Text einzutragen,
		// wird einfach der deutsche Key ausgegeben.
		return key;
	}
	return entry[lang] || entry['de-ch'] || key;
}
