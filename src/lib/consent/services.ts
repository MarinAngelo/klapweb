/**
 * Cookie-/Dienste-Registry (Schweizer Recht: Art. 45c FMG + DSG, Opt-out-Modell)
 *
 * JEDER Dienst, der Cookies setzt, Daten im Browser speichert oder Besucherdaten
 * (z.B. IP-Adresse) an Dritte überträgt, MUSS hier registriert sein.
 * Nicht-funktionale Dienste werden im Code mit <ConsentGate service="…"> umschlossen:
 * nur so erscheint der Cookie-Banner auf Seiten, die den Dienst nutzen, und nur so
 * kann der Besucher den Dienst ablehnen.
 *
 * `purpose` ist ein i18n-Key (translations.ts).
 */

export type ConsentCategory = 'functional' | 'external_media' | 'statistics' | 'marketing';

export type ConsentService = {
	label: string;
	provider: string;
	category: ConsentCategory;
	purpose: string;
	/** Cookie-/Speicher-Namen bzw. Art der Datenübertragung */
	storage: string[];
	privacyUrl?: string;
};

/** Order = display order in the settings dialog. Labels/descriptions are i18n keys. */
export const consentCategories: Record<ConsentCategory, { label: string; description: string }> = {
	functional: {
		label: 'Funktional',
		description:
			'Für den Betrieb der Website erforderlich (z.B. Anmeldung, geschützte Seiten, Ihre Cookie-Auswahl). Können nicht deaktiviert werden.'
	},
	external_media: {
		label: 'Externe Inhalte',
		description:
			'Karten, Videos und andere eingebettete Inhalte von Drittanbietern. Diese können Cookies setzen und erhalten Ihre IP-Adresse.'
	},
	statistics: {
		label: 'Statistik',
		description: 'Anonyme oder pseudonyme Auswertung der Nutzung dieser Website.'
	},
	marketing: {
		label: 'Marketing',
		description: 'Werbung und Wiedererkennung über verschiedene Websites hinweg.'
	}
};

export const consentServices: Record<string, ConsentService> = {
	// ── Funktional ───────────────────────────────────────────────────────────
	user_session: {
		label: 'Benutzerkonto',
		provider: 'Website-Betreiber',
		category: 'functional',
		purpose: 'Hält Sie nach der Anmeldung in Ihrem Benutzerkonto angemeldet.',
		storage: ['klap_user_session (Cookie)']
	},
	page_password: {
		label: 'Passwortgeschützte Seiten',
		provider: 'Website-Betreiber',
		category: 'functional',
		purpose: 'Merkt sich die Freigabe passwortgeschützter Seiten.',
		storage: ['klap_auth (Cookie)']
	},
	consent_choice: {
		label: 'Cookie-Auswahl',
		provider: 'Website-Betreiber',
		category: 'functional',
		purpose: 'Speichert Ihre Auswahl in diesem Cookie-Dialog.',
		storage: ['klap_consent (Local Storage)']
	},

	// ── Externe Inhalte ──────────────────────────────────────────────────────
	google_maps: {
		label: 'Google Maps',
		provider: 'Google Ireland Ltd. / Google LLC',
		category: 'external_media',
		purpose: 'Anzeige interaktiver Karten.',
		storage: ['Google-Cookies (z.B. NID)', 'Übertragung der IP-Adresse an Google'],
		privacyUrl: 'https://policies.google.com/privacy'
	},
	youtube: {
		label: 'YouTube',
		provider: 'Google Ireland Ltd. / Google LLC',
		category: 'external_media',
		purpose: 'Wiedergabe eingebetteter Videos.',
		storage: [
			'YouTube-Cookies (z.B. VISITOR_INFO1_LIVE, YSC)',
			'Übertragung der IP-Adresse an Google'
		],
		privacyUrl: 'https://policies.google.com/privacy'
	},
	vimeo: {
		label: 'Vimeo',
		provider: 'Vimeo.com Inc.',
		category: 'external_media',
		purpose: 'Wiedergabe eingebetteter Videos.',
		storage: ['Vimeo-Cookies (z.B. vuid)', 'Übertragung der IP-Adresse an Vimeo'],
		privacyUrl: 'https://vimeo.com/privacy'
	},
	external_embed: {
		label: 'Eingebetteter Inhalt',
		provider: 'Drittanbieter',
		category: 'external_media',
		purpose: 'Anzeige von Inhalten, die von einer externen Website geladen werden.',
		storage: ['Cookies des Anbieters möglich', 'Übertragung der IP-Adresse an den Anbieter']
	}
};

/** Maps an external URL / oEmbed provider name to a registered service id */
export function serviceIdFor(urlOrProvider: string | undefined | null): string {
	const value = (urlOrProvider ?? '').toLowerCase();
	if (/youtube|youtu\.be/.test(value)) return 'youtube';
	if (/vimeo/.test(value)) return 'vimeo';
	if (/google\.[a-z.]+\/maps|maps\.google|goo\.gl\/maps|maps\.app\.goo\.gl/.test(value))
		return 'google_maps';
	return 'external_embed';
}

/**
 * Finds external iframe/script sources in HTML (e.g. HtmlCode slice).
 * Returns the service ids needed, or [] if the HTML only contains local content.
 */
export function servicesInHtml(html: string): string[] {
	const sources = [
		...html.matchAll(/<(?:iframe|script|embed|object)\b[^>]*\b(?:src|data)=["']([^"']+)["']/gi)
	]
		.map((match) => match[1])
		.filter((src) => /^(https?:)?\/\//i.test(src));
	return [...new Set(sources.map(serviceIdFor))];
}
