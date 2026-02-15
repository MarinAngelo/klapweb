/**
 * Zentrale Übersetzungsdatei
 * Key: Immer der deutsche Text (de-ch)
 * Values: Objekt mit den jeweiligen Übersetzungen
 */
import { dev } from '$app/environment';
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
	},
	'Verantwortliche Person/Firma fehlt': {
		'de-ch':
			'Bitte für die Inhalte verantwortliche Person oder Firma im CMS unter Einstellungen eintragen',
		'en-us':
			'Please enter the person or company responsible for the content in the CMS under settings'
	},
	'Adresse fehlt': {
		'de-ch': 'Bitte Adresse der verantwortlichen Person oder Firma im CMS eintragen',
		'en-us': 'Please enter the address of the responsible person or company in the CMS'
	},
	'E-Mail fehlt': {
		'de-ch': 'Bitte E-Mail-Adresse für die Kontaktaufnahme im CMS eintragen',
		'en-us': 'Please enter an email address for contact in the CMS'
	},
	'Cookie-Informationstext': {
		'de-ch':
			'Wir legen grossen Wert auf den Schutz Ihrer Privatsphäre. Daher verzichten wir auf dieser Website vollständig auf den Einsatz von Cookies.\n\nEs werden weder technisch notwendige Cookies noch Tracking-Cookies (wie z.B. von Google Analytics) auf Ihrem Endgerät gespeichert. Dementsprechend wird beim Aufruf unserer Website auch kein Cookie-Banner angezeigt, da keine Einwilligung zur Datenverarbeitung mittels Cookies erforderlich ist.',
		'en-us':
			'We place great importance on protecting your privacy. Therefore, we completely refrain from using cookies on this website.\n\nNeither technically necessary cookies nor tracking cookies (such as Google Analytics) are stored on your device. Consequently, no cookie banner is displayed when you visit our website, as no consent for data processing via cookies is required.'
	},
    'Impressum': {
		'de-ch': 'Impressum',
		'en-us': 'Legal Notice'
	},
    'Datenschutz': {
        'de-ch': 'Datenschutzerklärung',
        'en-us': 'Privacy Policy'   
    },
    'AGB': {
        'de-ch': 'AGB',
        'en-us': 'Terms and Conditions'
    },
    'Kontaktadresse & Verantwortlichkeit': {
        'de-ch': 'Kontaktadresse & Verantwortlichkeit',
        'en-us': 'Contact Address & Responsibility'
    },
    'Quellenangaben & Realisierung': {
        'de-ch': 'Quellenangaben & Realisierung',
        'en-us': 'Sources & Implementation'
    },
    'Webentwicklung': {
        'de-ch': 'Webentwicklung',
        'en-us': 'Web Development'
    },
    'Design': {
        'de-ch': 'Design',
        'en-us': 'Design'
    },

};

/**
 * Die Helper-Funktion für Logik-Teile (Vorschlag 1)
 * Nutzt den Key als Fallback, falls keine Übersetzung existiert.
 */
export function t(key: string, lang: string): string {
	const entry = translations[key];
	if (!entry) {
        if (dev) {
					console.warn(`[i18n] Fehlender Key: "${key}"`);
				}
		// Falls wir mal vergessen, einen Text einzutragen,
		// wird einfach der deutsche Key ausgegeben.
		return key;
	}
	return entry[lang] || entry['de-ch'] || key;
}
