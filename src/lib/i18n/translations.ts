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
    'Erhebung und Verarbeitung von Daten': {
        'de-ch': 'Erhebung und Verarbeitung von Daten',
        'en-us': 'Collection and Processing of Data'
    },
    'Recht auf Auskunft, Berichtigung, Löschung und Sperrung': {
        'de-ch': 'Recht auf Auskunft, Berichtigung, Löschung und Sperrung',
        'en-us': 'Right to Information, Correction, Deletion and Blocking'
    },
    'Kontaktaufnahme': {
        'de-ch': 'Kontaktaufnahme',
        'en-us': 'Contact'
    },
    'Beim Besuch dieser Website werden Zugriffsdaten gespeichert...': {
        'de-ch': 'Beim Besuch dieser Website werden Zugriffsdaten gespeichert, die für die Bereitstellung der Website notwendig sind. Diese Daten umfassen Informationen wie die IP-Adresse, den Browsertyp, die Uhrzeit des Zugriffs und die angeforderten Seiten. Diese Informationen werden ausschließlich für die technische Bereitstellung der Website verwendet und nicht an Dritte weitergegeben.',
        'en-us': 'When visiting this website, access data is stored that is necessary for the provision of the website. This data includes information such as the IP address, browser type, time of access, and requested pages. This information is used solely for the technical provision of the website and is not shared with third parties.'
    },
    'Diese Website verarbeitet personenbezogene Daten gemäß den gesetzlichen Bestimmungen.': {
        'de-ch': 'Diese Website verarbeitet personenbezogene Daten gemäß den gesetzlichen Bestimmungen. Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen. Dazu gehören beispielsweise Name, E-Mail-Adresse, IP-Adresse und andere Informationen, die zur Identifizierung einer Person verwendet werden können.',
        'en-us': 'This website processes personal data in accordance with legal requirements. Personal data is any information relating to an identified or identifiable natural person. This includes, for example, name, email address, IP address, and other information that can be used to identify a person.'
    },
    'Verantwortliche Stelle': {
        'de-ch': 'Verantwortliche Stelle',
        'en-us': 'Responsible Entity'
    },
    'Rechtsgrundlage der Verarbeitung': {
        'de-ch': 'Rechtsgrundlage der Verarbeitung',
        'en-us': 'Legal Basis for Processing'
    },
    'Datenweitergabe an Dritte': {
        'de-ch': 'Datenweitergabe an Dritte',
        'en-us': 'Data Sharing with Third Parties'
    },
    'Datenübermittlung in Drittländer': {
        'de-ch': 'Datenübermittlung in Drittländer',
        'en-us': 'Data Transfer to Third Countries'
    },
    'Dauer der Datenspeicherung': {
        'de-ch': 'Dauer der Datenspeicherung',
        'en-us': 'Duration of Data Storage'
    },
    'Betroffenenrechte': {
        'de-ch': 'Betroffenenrechte',
        'en-us': 'Data Subject Rights'
    },
    'Einsatz von Cookies': {
        'de-ch': 'Einsatz von Cookies',
        'en-us': 'Use of Cookies'
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
