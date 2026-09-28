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
	'Route planen': {
		'de-ch': 'Route planen',
		'en-us': 'Get directions'
	},
	'Beispiel-Überschrift': { 'de-ch': 'Beispiel-Überschrift', 'en-us': 'Example Heading' },
	Beispiel: { 'de-ch': 'Beispiel', 'en-us': 'Example' },
	Überschrift: { 'de-ch': 'Überschrift', 'en-us': 'Heading' },
	'Max Mustermann': { 'de-ch': 'Max Mustermann', 'en-us': 'John Doe' },
	'Beispiel-Label': { 'de-ch': 'Beispiel-Label', 'en-us': 'Example Label' },
	Beispieltext: { 'de-ch': 'Beispieltext', 'en-us': 'Example text' },
	Platzhalterbild: { 'de-ch': 'Platzhalterbild', 'en-us': 'Placeholder image' },
	'Paket auswählen': {
		'de-ch': 'Paket auswählen',
		'en-us': 'Select plan'
	},
	Beschreibung: {
		'de-ch': 'Beschreibung',
		'en-us': 'Description'
	},
	'Kein Component registriert für': {
		'de-ch': 'Kein Component registriert für',
		'en-us': 'No component registered for'
	},
	Zurück: {
		'de-ch': 'Zurück',
		'en-us': 'Back'
	},
	'Elemente auswählen': {
		'de-ch': 'Elemente auswählen',
		'en-us': 'Select element'
	},
	'Inhalts-Elemente': {
		'de-ch': 'Inhalts-Elemente',
		'en-us': 'Content Elements'
	},
	Plan: {
		'de-ch': 'Plan',
		'en-us': 'Plan'
	},
	Laptop: {
		'de-ch': 'Laptop',
		'en-us': 'Laptop'
	},
	Telefon: {
		'de-ch': 'Telefon',
		'en-us': 'Phone'
	},
	Funktionen: {
		'de-ch': 'Funktionen',
		'en-us': 'Functions'
	},
	'Slice-Katalog': {
		'de-ch': 'Slice-Katalog',
		'en-us': 'Slice Catalog'
	},
	'Wähle einen Slice aus der Navigation': {
		'de-ch': 'Wähle ein Inhalts-Element aus der Navigation',
		'en-us': 'Select a slice from the navigation'
	},
	// RessourceBuchung Slice
	Anreise: { 'de-ch': 'Anreise', 'en-us': 'Check-in' },
	Abreise: { 'de-ch': 'Abreise', 'en-us': 'Check-out' },
	'Anzahl Personen': { 'de-ch': 'Anzahl Personen', 'en-us': 'Number of persons' },
	Maximal: { 'de-ch': 'Maximal', 'en-us': 'Maximum' },
	Personen: { 'de-ch': 'Personen', 'en-us': 'persons' },
	Name: { 'de-ch': 'Name', 'en-us': 'Name' },
	Nachricht: { 'de-ch': 'Nachricht', 'en-us': 'Message' },
	Preisvorschau: { 'de-ch': 'Preisvorschau', 'en-us': 'Price preview' },
	'Verfügbarkeit wird geladen…': {
		'de-ch': 'Verfügbarkeit wird geladen…',
		'en-us': 'Loading availability…'
	},
	Nacht: { 'de-ch': 'Nacht', 'en-us': 'night' },
	Nächte: { 'de-ch': 'Nächte', 'en-us': 'nights' },
	Schlafzimmer: { 'de-ch': 'Schlafzimmer', 'en-us': 'Bedrooms' },
	'Bereits gebucht': { 'de-ch': 'Bereits gebucht', 'en-us': 'Already booked' },
	'Voll belegt': { 'de-ch': 'Voll belegt', 'en-us': 'Fully booked' },
	'Teilweise belegt': { 'de-ch': 'Teilweise belegt', 'en-us': 'Partially booked' },
	Frei: { 'de-ch': 'Frei', 'en-us': 'Available' },
	'Gewählter Zeitraum': { 'de-ch': 'Gewählter Zeitraum', 'en-us': 'Selected period' },
	Zimmerauswahl: { 'de-ch': 'Zimmerauswahl', 'en-us': 'Room selection' },
	'Ausgewählte Zimmer': { 'de-ch': 'Ausgewählte Zimmer', 'en-us': 'Selected rooms' },
	Belegt: { 'de-ch': 'Belegt', 'en-us': 'Unavailable' },
	'Alle gewählten Zimmer sind in diesem Zeitraum belegt': {
		'de-ch': 'Alle gewählten Zimmer sind in diesem Zeitraum belegt',
		'en-us': 'All selected rooms are booked in this period'
	},
	'Bitte mindestens ein Zimmer auswählen': {
		'de-ch': 'Bitte mindestens ein Zimmer auswählen',
		'en-us': 'Please select at least one room'
	},
	'Ausgewählte Zimmer bieten Platz für maximal': {
		'de-ch': 'Ausgewählte Zimmer bieten Platz für maximal',
		'en-us': 'Selected rooms accommodate a maximum of'
	},
	Kapazität: { 'de-ch': 'Kapazität', 'en-us': 'Capacity' },
	Mindestaufenthalt: { 'de-ch': 'Mindestaufenthalt', 'en-us': 'Minimum stay' },
	'Für den gewünschten Zeitraum sind nur noch einzelne Zimmer buchbar': {
		'de-ch': 'Für den gewünschten Zeitraum sind nur noch einzelne Zimmer buchbar',
		'en-us': 'Only individual rooms are available for the selected period'
	},
	'Preis pro Nacht ab': { 'de-ch': 'Preis pro Nacht ab', 'en-us': 'Price per night from' },
	'Jetzt anfragen': { 'de-ch': 'Jetzt anfragen', 'en-us': 'Request now' },
	'Freundes-Referenz-E-Mail Adresse': {
		'de-ch': 'Freundes-Referenz-E-Mail Adresse',
		'en-us': 'Friend referral email address'
	},
	'Wird geprüft…': { 'de-ch': 'Wird geprüft…', 'en-us': 'Checking…' },
	'E-Mail gefunden': { 'de-ch': 'E-Mail gefunden', 'en-us': 'Email found' },
	'E-Mail nicht gefunden': { 'de-ch': 'E-Mail nicht gefunden', 'en-us': 'Email not found' },
	'Wird gesendet…': { 'de-ch': 'Wird gesendet…', 'en-us': 'Sending…' },
	'Anfrage erhalten!': { 'de-ch': 'Anfrage erhalten!', 'en-us': 'Request received!' },
	'Wir melden uns in Kürze bei Ihnen.': {
		'de-ch': 'Wir melden uns in Kürze bei Ihnen.',
		'en-us': 'We will get back to you shortly.'
	},
	'Abreise muss nach Anreise liegen': {
		'de-ch': 'Abreise muss nach Anreise liegen',
		'en-us': 'Check-out must be after check-in'
	},
	'Dieser Zeitraum ist bereits belegt': {
		'de-ch': 'Dieser Zeitraum ist bereits belegt',
		'en-us': 'This period is already booked'
	},
	'Dieser Zeitraum ist leider nicht mehr verfügbar': {
		'de-ch': 'Dieser Zeitraum ist leider nicht mehr verfügbar',
		'en-us': 'This period is unfortunately no longer available'
	},
	'Ein Fehler ist aufgetreten': {
		'de-ch': 'Ein Fehler ist aufgetreten',
		'en-us': 'An error occurred'
	},
	'Keine Ressource verknüpft': {
		'de-ch': 'Keine Ressource verknüpft',
		'en-us': 'No resource linked'
	},
	'Ganze Wohnung': { 'de-ch': 'Ganze Wohnung', 'en-us': 'Entire apartment' },
	Einzelzimmer: { 'de-ch': 'Einzelzimmer', 'en-us': 'Individual room' },
	Buchungsart: { 'de-ch': 'Buchungsart', 'en-us': 'Booking type' },
	'Zimmer auswählen': { 'de-ch': 'Zimmer auswählen', 'en-us': 'Select room' },
	'Zimmer wird geladen…': { 'de-ch': 'Zimmer wird geladen…', 'en-us': 'Loading room…' },
	'Wohnung auswählen': { 'de-ch': 'Wohnung auswählen', 'en-us': 'Select apartment' },

	// Slice-Namen
	Akkordeon: { 'de-ch': 'Akkordeon', 'en-us': 'Accordion' },
	AdresseUndMap: { 'de-ch': 'Adresse & Karte', 'en-us': 'Address & Map' },
	Anleitung: { 'de-ch': 'Anleitung', 'en-us': 'Instructions' },
	Bild: { 'de-ch': 'Bild', 'en-us': 'Image' },
	Schaltfläche: { 'de-ch': 'Schaltfläche', 'en-us': 'Button' },
	Event: { 'de-ch': 'Event', 'en-us': 'Event' },
	Formular: { 'de-ch': 'Formular', 'en-us': 'Form' },
	GlobaleEvents: { 'de-ch': 'Globale Events', 'en-us': 'Global Events' },
	'Globale Events': { 'de-ch': 'Globale Events', 'en-us': 'Global Events' },
	MapEinbetten: { 'de-ch': 'MapEinbetten', 'en-us': 'Embed map' },
	HtmlCode: { 'de-ch': 'HtmlCode', 'en-us': 'HTML Code' },
	Inhaltsverzeichnis: { 'de-ch': 'Inhaltsverzeichnis', 'en-us': 'Table of Contents' },
	Kacheln: { 'de-ch': 'Kacheln', 'en-us': 'Tiles' },
	P5Grafik: { 'de-ch': 'P5Grafik', 'en-us': 'P5 Graphic' },
	Preisaufstellung: { 'de-ch': 'Preisaufstellung', 'en-us': 'Price List' },
	Preisvergleich: { 'de-ch': 'Preisvergleich', 'en-us': 'Price Comparison' },
	Stimmen: { 'de-ch': 'Stimmen', 'en-us': 'Testimonials' },
	Timeline: { 'de-ch': 'Timeline', 'en-us': 'Timeline' },
	'Text&Aktion': { 'de-ch': 'Text&Aktion', 'en-us': 'Text & CTA' },
	TextMitBild: { 'de-ch': 'TextMitBild', 'en-us': 'Text With Image' },
	Text: { 'de-ch': 'Text', 'en-us': 'Text' },
	Titelbereich: { 'de-ch': 'Titelbereich', 'en-us': 'Hero' },
	Zitat: { 'de-ch': 'Zitat', 'en-us': 'Quote' },
	Galerie: { 'de-ch': 'Galerie', 'en-us': 'Gallery' },
	// Variations-Namen
	Standard: { 'de-ch': 'Standard', 'en-us': 'Default' },
	Standart: { 'de-ch': 'Standart', 'en-us': 'Default' },
	Default: { 'de-ch': 'Default', 'en-us': 'Default' },
	'Bild und Text': { 'de-ch': 'Bild und Text', 'en-us': 'Image and Text' },
	Leistungen: { 'de-ch': 'Leistungen', 'en-us': 'Services' },
	Banner: { 'de-ch': 'Banner', 'en-us': 'Banner' },
	Karussell: { 'de-ch': 'Karussell', 'en-us': 'Carousel' },
	'Vorher/Nachher': { 'de-ch': 'Vorher/Nachher', 'en-us': 'Before/After' },
	'Kauf-Schaltfläche': { 'de-ch': 'Kauf-Schaltfläche', 'en-us': 'Purchase Button' },
	'Mit Termin': { 'de-ch': 'Mit Termin', 'en-us': 'With Appointment' },
	'Kauf-Formular': { 'de-ch': 'Kauf-Formular', 'en-us': 'Purchase Form' },
	Pläne: { 'de-ch': 'Pläne', 'en-us': 'Plans' },
	'Standard (Vollbild)': { 'de-ch': 'Standard (Vollbild)', 'en-us': 'Default (Full Screen)' },
	'Mit Titelbereich': { 'de-ch': 'Mit Titelbereich', 'en-us': 'With Hero' },
	'Standard Bild rechts': { 'de-ch': 'Standard Bild rechts', 'en-us': 'Default Image Right' },
	'Mit Schaltfläche': { 'de-ch': 'Mit Schaltfläche', 'en-us': 'With Button' },
	'Standard Bild links': { 'de-ch': 'Standard Bild links', 'en-us': 'Default Image Left' },
	'Zwei Spalten': { 'de-ch': 'Zwei Spalten', 'en-us': 'Two Columns' },
	'Mit Bild Karusell': { 'de-ch': 'Mit Bild Karusell', 'en-us': 'With Image Carousel' },
	Details: { 'de-ch': 'Details', 'en-us': 'Details' },

	// Funktions-Panel Labels
	'2 Spalten': { 'de-ch': '2 Spalten', 'en-us': '2 Columns' },
	'Bild Links (Vorher)': { 'de-ch': 'Bild Links (Vorher)', 'en-us': 'Image Left (Before)' },
	'Bild Rechts (Nachher)': { 'de-ch': 'Bild Rechts (Nachher)', 'en-us': 'Image Right (After)' },
	'Innerer Abstand oben / unten gleich': {
		'de-ch': 'Innerer Abstand oben / unten gleich',
		'en-us': 'Equal top/bottom spacing'
	},
	'Nach oben': { 'de-ch': 'Nach oben', 'en-us': 'Back to top' },
	'Animation aktivieren': { 'de-ch': 'Animation aktivieren', 'en-us': 'Enable animation' },
	'Animations-Richtung': { 'de-ch': 'Animations-Richtung', 'en-us': 'Animation direction' },
	'Animationsdauer (ms)': { 'de-ch': 'Animationsdauer (ms)', 'en-us': 'Animation duration (ms)' },
	Ausrichtung: { 'de-ch': 'Ausrichtung', 'en-us': 'Alignment' },
	'Bild als Kreis': { 'de-ch': 'Bild als Kreis', 'en-us': 'Image as circle' },
	Bildschirmhoch: { 'de-ch': 'Bildschirmhoch', 'en-us': 'Full viewport height' },
	'Erstes Item ausgeklappt': { 'de-ch': 'Erstes Item ausgeklappt', 'en-us': 'First item expanded' },
	Grösse: { 'de-ch': 'Grösse', 'en-us': 'Size' },
	'Hervorgehobener Plan': { 'de-ch': 'Hervorgehobener Plan', 'en-us': 'Featured plan' },
	'Kontrast-Offset (leer = automatisch)': {
		'de-ch': 'Kontrast-Offset (leer = automatisch)',
		'en-us': 'Contrast offset (empty = automatic)'
	},
	'Mobile: Volle Breite': { 'de-ch': 'Mobile: Volle Breite', 'en-us': 'Mobile: Full width' },
	'Rahmen um die Sektion': { 'de-ch': 'Rahmen um die Sektion', 'en-us': 'Section border' },
	'Runde Ecken': { 'de-ch': 'Runde Ecken', 'en-us': 'Rounded corners' },
	'Schaltfläche Ausrichtung': { 'de-ch': 'Schaltfläche Ausrichtung', 'en-us': 'Button alignment' },
	'Schaltfläche Grösse': { 'de-ch': 'Schaltfläche Grösse', 'en-us': 'Button size' },
	'Schriftgrösse Desktop (%)': {
		'de-ch': 'Schriftgrösse Desktop (%)',
		'en-us': 'Font size desktop (%)'
	},
	'Schriftgrösse Mobile (%)': {
		'de-ch': 'Schriftgrösse Mobile (%)',
		'en-us': 'Font size mobile (%)'
	},
	'Scrollen einrasten': { 'de-ch': 'Scrollen einrasten', 'en-us': 'Scroll snapping' },
	Sketch: { 'de-ch': 'Sketch', 'en-us': 'Sketch' },
	'Spalten je Reihe': { 'de-ch': 'Spalten je Reihe', 'en-us': 'Columns per row' },
	'Suche aktivieren': { 'de-ch': 'Suche aktivieren', 'en-us': 'Enable search' },
	'Text Hintergrund in Mobile aus': {
		'de-ch': 'Text Hintergrund in Mobile aus',
		'en-us': 'Disable text background on mobile'
	},
	'Text Überlagerungsfeld Grösse': {
		'de-ch': 'Text Überlagerungsfeld Grösse',
		'en-us': 'Text overlay field size'
	},
	Textausrichtung: { 'de-ch': 'Textausrichtung', 'en-us': 'Text alignment' },
	'Textgrösse Mobile': { 'de-ch': 'Textgrösse Mobile', 'en-us': 'Font size mobile' },
	'Titelbild Höhe': { 'de-ch': 'Titelbild Höhe', 'en-us': 'Hero height' },
	Transparenz: { 'de-ch': 'Transparenz', 'en-us': 'Transparency' },
	'Transparenz Text Überlagerungsfarbe': {
		'de-ch': 'Transparenz Text Überlagerungsfarbe',
		'en-us': 'Text overlay color transparency'
	},
	'Transparenz der Kopfzeile': {
		'de-ch': 'Transparenz der Kopfzeile',
		'en-us': 'Header transparency'
	},
	'Transparenz der Überlagerung': {
		'de-ch': 'Transparenz der Überlagerung',
		'en-us': 'Overlay transparency'
	},
	'Transparenz der Überlagerungsfarbe': {
		'de-ch': 'Transparenz der Überlagerungsfarbe',
		'en-us': 'Overlay color transparency'
	},
	'Transparenz überlagerter Kopfzeile': {
		'de-ch': 'Transparenz überlagerter Kopfzeile',
		'en-us': 'Overlapping header transparency'
	},
	'Vertikaler Abstand': { 'de-ch': 'Vertikaler Abstand', 'en-us': 'Vertical spacing' },
	'Verzögerung (ms)': { 'de-ch': 'Verzögerung (ms)', 'en-us': 'Delay (ms)' },
	'Vollbreite auf Mobile': { 'de-ch': 'Vollbreite auf Mobile', 'en-us': 'Full width on mobile' },
	'Überlappend mit Kopfzeile': {
		'de-ch': 'Überlappend mit Kopfzeile',
		'en-us': 'Overlapping with header'
	},
	// Select-Optionen
	Gross: { 'de-ch': 'Gross', 'en-us': 'Large' },
	gross: { 'de-ch': 'gross', 'en-us': 'large' },
	Klein: { 'de-ch': 'Klein', 'en-us': 'Small' },
	klein: { 'de-ch': 'klein', 'en-us': 'small' },
	Kleiner: { 'de-ch': 'Kleiner', 'en-us': 'Smaller' },
	Keine: { 'de-ch': 'Keine', 'en-us': 'None' },
	Keiner: { 'de-ch': 'Keiner', 'en-us': 'None' },
	Links: { 'de-ch': 'Links', 'en-us': 'Left' },
	Mitte: { 'de-ch': 'Mitte', 'en-us': 'Center' },
	Mittel: { 'de-ch': 'Mittel', 'en-us': 'Medium' },
	mittel: { 'de-ch': 'mittel', 'en-us': 'medium' },
	Normal: { 'de-ch': 'Normal', 'en-us': 'Normal' },
	Oben: { 'de-ch': 'Oben', 'en-us': 'Top' },
	Rechts: { 'de-ch': 'Rechts', 'en-us': 'Right' },
	'Sehr klein': { 'de-ch': 'Sehr klein', 'en-us': 'Very small' },
	Unten: { 'de-ch': 'Unten', 'en-us': 'Bottom' },
	'kein Abstand': { 'de-ch': 'kein Abstand', 'en-us': 'No spacing' },
	wenig: { 'de-ch': 'wenig', 'en-us': 'Little' },
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
	Impressum: {
		'de-ch': 'Impressum',
		'en-us': 'Legal Notice'
	},
	Datenschutz: {
		'de-ch': 'Datenschutzerklärung',
		'en-us': 'Privacy Policy'
	},
	AGB: {
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
	Webentwicklung: {
		'de-ch': 'Webentwicklung',
		'en-us': 'Web Development'
	},
	Design: {
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
	Kontaktaufnahme: {
		'de-ch': 'Kontaktaufnahme',
		'en-us': 'Contact'
	},
	'Beim Besuch dieser Website werden Zugriffsdaten gespeichert...': {
		'de-ch':
			'Beim Besuch dieser Website werden Zugriffsdaten gespeichert, die für die Bereitstellung der Website notwendig sind. Diese Daten umfassen Informationen wie die IP-Adresse, den Browsertyp, die Uhrzeit des Zugriffs und die angeforderten Seiten. Diese Informationen werden ausschließlich für die technische Bereitstellung der Website verwendet und nicht an Dritte weitergegeben.',
		'en-us':
			'When visiting this website, access data is stored that is necessary for the provision of the website. This data includes information such as the IP address, browser type, time of access, and requested pages. This information is used solely for the technical provision of the website and is not shared with third parties.'
	},
	'Diese Website verarbeitet personenbezogene Daten gemäß den gesetzlichen Bestimmungen.': {
		'de-ch':
			'Diese Website verarbeitet personenbezogene Daten gemäß den gesetzlichen Bestimmungen. Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen. Dazu gehören beispielsweise Name, E-Mail-Adresse, IP-Adresse und andere Informationen, die zur Identifizierung einer Person verwendet werden können.',
		'en-us':
			'This website processes personal data in accordance with legal requirements. Personal data is any information relating to an identified or identifiable natural person. This includes, for example, name, email address, IP address, and other information that can be used to identify a person.'
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
	Betroffenenrechte: {
		'de-ch': 'Betroffenenrechte',
		'en-us': 'Data Subject Rights'
	},
	'Einsatz von Cookies': {
		'de-ch': 'Einsatz von Cookies',
		'en-us': 'Use of Cookies'
	},
	Kontakt: {
		'de-ch': 'Kontakt',
		'en-us': 'Contact'
	},
	'Website erstellt mit': {
		'de-ch': 'Website erstellt mit',
		'en-us': 'Website created with'
	},
	'Alle Rechte vorbehalten.': {
		'de-ch': 'Alle Rechte vorbehalten.',
		'en-us': 'All rights reserved.'
	},
	'Meine Zeit': {
		'de-ch': 'Meine lokale Zeit',
		'en-us': 'Local Time'
	},

	// Form validation
	'Bitte Feld ausfüllen': {
		'de-ch': 'Bitte Feld ausfüllen',
		'en-us': 'Please fill in this field'
	},
	'Bitte eine gültige E-Mail-Adresse eingeben': {
		'de-ch': 'Bitte eine gültige E-Mail-Adresse eingeben',
		'en-us': 'Please enter a valid email address'
	},
	'Links sind im Kontaktformular nicht erlaubt. Bitte entfernen Sie Links aus:': {
		'de-ch': 'Links sind im Kontaktformular nicht erlaubt. Bitte entfernen Sie Links aus:',
		'en-us': 'Links are not allowed in the contact form. Please remove links from:'
	},
	'Buchung fehlgeschlagen. Bitte versuchen Sie es erneut.': {
		'de-ch': 'Buchung fehlgeschlagen. Bitte versuchen Sie es erneut.',
		'en-us': 'Booking failed. Please try again.'
	},
	'Dieser Termin ist leider nicht mehr verfügbar.': {
		'de-ch': 'Dieser Termin ist leider nicht mehr verfügbar.',
		'en-us': 'This appointment is no longer available.'
	},
	'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.': {
		'de-ch': 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.',
		'en-us': 'Sending failed. Please try again.'
	},
	'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.': {
		'de-ch': 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
		'en-us': 'An error occurred. Please try again.'
	},
	'Bitte ausfüllen': {
		'de-ch': 'Bitte ausfüllen',
		'en-us': 'Please fill in'
	},
	'Bitte gültige E-Mail eingeben': {
		'de-ch': 'Bitte gültige E-Mail eingeben',
		'en-us': 'Please enter a valid email'
	},

	// Checkout flow
	'Bitte Zahlungsart wählen': {
		'de-ch': 'Bitte Zahlungsart wählen',
		'en-us': 'Please select a payment method'
	},
	'Kostenpflichtig bestellen': {
		'de-ch': 'Kostenpflichtig bestellen',
		'en-us': 'Order (chargeable)'
	},
	'Rechnung anfordern': {
		'de-ch': 'Rechnung anfordern',
		'en-us': 'Request invoice'
	},
	'Bestellung absenden': {
		'de-ch': 'Bestellung absenden',
		'en-us': 'Submit order'
	},
	'Bitte warten…': {
		'de-ch': 'Bitte warten…',
		'en-us': 'Please wait…'
	},
	'Ungültiger Rabatt-Code.': {
		'de-ch': 'Ungültiger Rabatt-Code.',
		'en-us': 'Invalid discount code.'
	},
	'Abgelaufener Rabatt-Code.': {
		'de-ch': 'Rabatt-Code ist abgelaufen.',
		'en-us': 'Discount code has expired.'
	},
	'Verbindungsfehler bei Code-Prüfung.': {
		'de-ch': 'Verbindungsfehler bei Code-Prüfung.',
		'en-us': 'Connection error during code verification.'
	},
	'Ein Fehler ist aufgetreten.': {
		'de-ch': 'Ein Fehler ist aufgetreten.',
		'en-us': 'An error occurred.'
	},
	Buchungsreferenz: {
		'de-ch': 'Buchungsreferenz',
		'en-us': 'Booking reference'
	},
	'Check-in ab': {
		'de-ch': 'Check-in ab',
		'en-us': 'Check-in from'
	},
	'Check-out ab': {
		'de-ch': 'Check-out ab',
		'en-us': 'Check-out from'
	},
	'Buchungsreferenz nicht gefunden.': {
		'de-ch': 'Buchungsreferenz nicht gefunden.',
		'en-us': 'Booking reference not found.'
	},
	'Bereits eingecheckt.': {
		'de-ch': 'Bereits eingecheckt.',
		'en-us': 'Already checked in.'
	},
	'Bereits ausgecheckt.': {
		'de-ch': 'Bereits ausgecheckt.',
		'en-us': 'Already checked out.'
	},
	Abschicken: {
		'de-ch': 'Abschicken',
		'en-us': 'Submit'
	},
	Kommentar: {
		'de-ch': 'Kommentar',
		'en-us': 'Comment'
	},
	'Erfolgreich eingecheckt.': {
		'de-ch': 'Erfolgreich eingecheckt.',
		'en-us': 'Successfully checked in.'
	},
	'Erfolgreich ausgecheckt.': {
		'de-ch': 'Erfolgreich ausgecheckt.',
		'en-us': 'Successfully checked out.'
	},
	'Verbindungsfehler. Bitte versuchen Sie es erneut.': {
		'de-ch': 'Verbindungsfehler. Bitte versuchen Sie es erneut.',
		'en-us': 'Connection error. Please try again.'
	},
	'Übermittlung fehlgeschlagen. Bitte versuchen Sie es erneut.': {
		'de-ch': 'Übermittlung fehlgeschlagen. Bitte versuchen Sie es erneut.',
		'en-us': 'Submission failed. Please try again.'
	},
	'Ihre Bestellung': {
		'de-ch': 'Ihre Bestellung',
		'en-us': 'Your order'
	},
	'Ihre Angaben': {
		'de-ch': 'Ihre Angaben',
		'en-us': 'Your details'
	},
	Zahlungsart: {
		'de-ch': 'Zahlungsart',
		'en-us': 'Payment method'
	},
	'Kreditkarte / TWINT': {
		'de-ch': 'Kreditkarte / TWINT',
		'en-us': 'Credit card / TWINT'
	},
	'Sofortige, sichere Zahlung via Stripe.': {
		'de-ch': 'Sofortige, sichere Zahlung via Stripe.',
		'en-us': 'Immediate, secure payment via Stripe.'
	},
	'Gegen Rechnung': {
		'de-ch': 'Gegen Rechnung',
		'en-us': 'By invoice'
	},
	'Sie erhalten eine PDF-Rechnung per E-Mail. Zahlungsfrist 30 Tage.': {
		'de-ch': 'Sie erhalten eine PDF-Rechnung per E-Mail. Zahlungsfrist 30 Tage.',
		'en-us': 'You will receive a PDF invoice by email. Payment term 30 days.'
	},
	'Gegen Bar': {
		'de-ch': 'Gegen Bar',
		'en-us': 'Cash'
	},
	'Wir melden uns zur Terminvereinbarung.': {
		'de-ch': 'Wir melden uns zur Terminvereinbarung.',
		'en-us': 'We will contact you to arrange an appointment.'
	},
	'Ich habe die AGB und die Datenschutzerklärung gelesen und akzeptiere diese.': {
		'de-ch': 'Ich habe die AGB und die Datenschutzerklärung gelesen und akzeptiere diese.',
		'en-us': 'I have read and accept the terms and conditions and privacy policy.'
	},
	'Laden…': {
		'de-ch': 'Laden…',
		'en-us': 'Loading…'
	},
	Anwenden: {
		'de-ch': 'Anwenden',
		'en-us': 'Apply'
	},
	Entfernen: {
		'de-ch': 'Entfernen',
		'en-us': 'Remove'
	},
	'Weiter zum Formular': {
		'de-ch': 'Weiter zum Formular',
		'en-us': 'Continue to form'
	},
	Vorname: {
		'de-ch': 'Vorname',
		'en-us': 'First name'
	},
	Nachname: {
		'de-ch': 'Nachname',
		'en-us': 'Last name'
	},
	Pflichtfelder: {
		'de-ch': 'Pflichtfelder',
		'en-us': 'Required fields'
	},
	Beauftragung: {
		'de-ch': 'Beauftragung',
		'en-us': 'Order'
	},
	Firma: {
		'de-ch': 'Firma',
		'en-us': 'Company'
	},
	'E-Mail': {
		'de-ch': 'E-Mail',
		'en-us': 'Email'
	},
	Adresse: {
		'de-ch': 'Adresse',
		'en-us': 'Address'
	},
	PLZ: {
		'de-ch': 'PLZ',
		'en-us': 'ZIP code'
	},
	Ort: {
		'de-ch': 'Ort',
		'en-us': 'City'
	},
	Projektname: {
		'de-ch': 'Projektname',
		'en-us': 'Project name'
	},
	Land: {
		'de-ch': 'Land',
		'en-us': 'Country'
	},
	'Registrierter Domainname': {
		'de-ch': 'Registrierter Domainname',
		'en-us': 'Registered domain name'
	},
	'Gewünschter Domainname': {
		'de-ch': 'Gewünschter Domainname',
		'en-us': 'Desired domain name'
	},
	'Tel. Nr.': {
		'de-ch': 'Tel. Nr.',
		'en-us': 'Phone no.'
	},
	Rechnungsadresse: {
		'de-ch': 'Rechnungsadresse',
		'en-us': 'Billing address'
	},
	Kommentare: {
		'de-ch': 'Kommentare',
		'en-us': 'Comments'
	},
	'Weitere Angaben': {
		'de-ch': 'Weitere Angaben',
		'en-us': 'Additional information'
	},
	Weiter: {
		'de-ch': 'Weiter',
		'en-us': 'Continue'
	},
	'Weiter zur Übersicht': {
		'de-ch': 'Weiter zur Übersicht',
		'en-us': 'Continue to summary'
	},
	Preis: {
		'de-ch': 'Preis',
		'en-us': 'Price'
	},
	'Preis wird bei Rückfrage mitgeteilt.': {
		'de-ch': 'Preis wird bei Rückfrage mitgeteilt.',
		'en-us': 'Price will be communicated upon request.'
	},
	'Rabatt-Code': {
		'de-ch': 'Rabatt-Code',
		'en-us': 'Discount code'
	},
	'Währung:': {
		'de-ch': 'Währung:',
		'en-us': 'Currency:'
	},

	// Confirmation page
	'Vielen Dank für Ihre Bestellung!': {
		'de-ch': 'Vielen Dank für Ihre Bestellung!',
		'en-us': 'Thank you for your order!'
	},
	'Zahlung gegen Rechnung': {
		'de-ch': 'Zahlung gegen Rechnung',
		'en-us': 'Payment by invoice'
	},
	'Ihre Rechnung wurde soeben per E-Mail versandt.': {
		'de-ch': 'Ihre Rechnung wurde soeben per E-Mail versandt.',
		'en-us': 'Your invoice has just been sent by email.'
	},
	'Bitte überweisen Sie den Betrag innerhalb von 30 Tagen.': {
		'de-ch': 'Bitte überweisen Sie den Betrag innerhalb von 30 Tagen.',
		'en-us': 'Please transfer the amount within 30 days.'
	},
	'Zahlung gegen Bar': {
		'de-ch': 'Zahlung gegen Bar',
		'en-us': 'Cash payment'
	},
	'Wir haben Ihre Bestellung erhalten und melden uns in Kürze zur Terminvereinbarung.': {
		'de-ch': 'Wir haben Ihre Bestellung erhalten und melden uns in Kürze zur Terminvereinbarung.',
		'en-us': 'We have received your order and will contact you shortly to arrange an appointment.'
	},
	'Die Zahlung erfolgt bei persönlicher Übergabe.': {
		'de-ch': 'Die Zahlung erfolgt bei persönlicher Übergabe.',
		'en-us': 'Payment will be made upon personal handover.'
	},
	'Sie erhalten in Kürze eine Bestätigungs-E-Mail.': {
		'de-ch': 'Sie erhalten in Kürze eine Bestätigungs-E-Mail.',
		'en-us': 'You will receive a confirmation email shortly.'
	},
	'Bei Fragen stehen wir Ihnen gerne zur Verfügung.': {
		'de-ch': 'Bei Fragen stehen wir Ihnen gerne zur Verfügung.',
		'en-us': 'If you have any questions, we are happy to help.'
	},
	'Zurück zur Startseite': {
		'de-ch': 'Zurück zur Startseite',
		'en-us': 'Back to home'
	},
	// Aufgaben Slice
	'Buchungs-ID': { 'de-ch': 'Buchungs-ID', 'en-us': 'Booking ID' },
	'Buchungs-Referenz': { 'de-ch': 'Buchungs-Referenz', 'en-us': 'Booking reference' },
	'Mit Buchungs-ID anmelden': {
		'de-ch': 'Mit Buchungs-ID anmelden',
		'en-us': 'Log in with booking ID'
	},
	Aufgabenliste: { 'de-ch': 'Aufgabenliste', 'en-us': 'Task list' },
	'Bitte melde dich mit der Buchungs-ID an, die du per E-Mail erhalten hast.': {
		'de-ch': 'Bitte melde dich mit der Buchungs-ID an, die du per E-Mail erhalten hast.',
		'en-us': 'Please log in with the booking ID you received by email.'
	},
	Aufgaben: { 'de-ch': 'Aufgaben', 'en-us': 'Tasks' },
	'Aufgabe annehmen': { 'de-ch': 'Aufgabe annehmen', 'en-us': 'Accept task' },
	'Aufgabe abgeben': { 'de-ch': 'Aufgabe abgeben', 'en-us': 'Submit task' },
	Angenommen: { 'de-ch': 'Angenommen', 'en-us': 'Accepted' },
	Erledigt: { 'de-ch': 'Erledigt', 'en-us': 'Done' },
	'Credits verdient': { 'de-ch': 'Credits verdient', 'en-us': 'Credits earned' },
	'Geleistete Minuten': { 'de-ch': 'Geleistete Minuten', 'en-us': 'Minutes spent' },
	'Keine Aufgaben verfügbar': {
		'de-ch': 'Keine Aufgaben verfügbar',
		'en-us': 'No tasks available'
	},
	'Aufgabe konnte nicht angenommen werden': {
		'de-ch': 'Aufgabe konnte nicht angenommen werden',
		'en-us': 'Task could not be accepted'
	},
	'Abgabe fehlgeschlagen': { 'de-ch': 'Abgabe fehlgeschlagen', 'en-us': 'Submission failed' },
	Einloggen: { 'de-ch': 'Anmelden', 'en-us': 'Log in' },
	'Ungültige Kombination von Buchungs-ID und E-Mail': {
		'de-ch': 'Ungültige Kombination von Buchungs-ID und E-Mail',
		'en-us': 'Invalid combination of booking ID and email'
	},
	'Meine Aufgaben': { 'de-ch': 'Meine Aufgaben', 'en-us': 'My tasks' },
	'Verfügbare Aufgaben': { 'de-ch': 'Verfügbare Aufgaben', 'en-us': 'Available tasks' },
	Abmelden: { 'de-ch': 'Abmelden', 'en-us': 'Log out' },
	Fest: { 'de-ch': 'Fest', 'en-us': 'Fixed' },
	Zeitbasiert: { 'de-ch': 'Zeitbasiert', 'en-us': 'Time-based' },
	'Credit-Typ': { 'de-ch': 'Credit-Typ', 'en-us': 'Credit type' },
	'pro Nacht': { 'de-ch': 'pro Nacht', 'en-us': 'per night' },
	'Minuten eingeben': { 'de-ch': 'Minuten eingeben', 'en-us': 'Enter minutes' },
	'Benötigte Werkzeuge': { 'de-ch': 'Benötigte Werkzeuge', 'en-us': 'Required tools' },
	'Kommentar (optional)': { 'de-ch': 'Kommentar (optional)', 'en-us': 'Comment (optional)' },
	'Kommentar oder Beschreibung der Aufgabe': {
		'de-ch': 'Kommentar oder Beschreibung der Aufgabe',
		'en-us': 'Comment or description of the task'
	},
	'Kommentar ist erforderlich': {
		'de-ch': 'Kommentar ist erforderlich',
		'en-us': 'Comment is required'
	},
	Fotos: { 'de-ch': 'Fotos', 'en-us': 'Photos' },
	Vorher: { 'de-ch': 'Vorher', 'en-us': 'Before' },
	Nachher: { 'de-ch': 'Nachher', 'en-us': 'After' },
	'Wird hochgeladen…': { 'de-ch': 'Wird hochgeladen…', 'en-us': 'Uploading…' },
	'Foto konnte nicht hochgeladen werden': {
		'de-ch': 'Foto konnte nicht hochgeladen werden',
		'en-us': 'Photo could not be uploaded'
	},
	'Aufgaben können erst ab dem Anreisetag angenommen werden': {
		'de-ch': 'Aufgaben können erst ab dem Anreisetag angenommen werden',
		'en-us': 'Tasks can only be accepted from the arrival day'
	},
	'Der Aufenthalt ist beendet — keine Aufgaben mehr möglich': {
		'de-ch': 'Der Aufenthalt ist beendet — keine Aufgaben mehr möglich',
		'en-us': 'The stay has ended — no more tasks possible'
	},
	'Abgabe nur während des Aufenthalts möglich (Anreise bis Abreise)': {
		'de-ch': 'Abgabe nur während des Aufenthalts möglich (Anreise bis Abreise)',
		'en-us': 'Submission only possible during the stay (arrival to departure)'
	},
	'Anhang (optional)': { 'de-ch': 'Anhang (optional)', 'en-us': 'Attachment (optional)' },
	'Kommentar eingeben': { 'de-ch': 'Kommentar eingeben', 'en-us': 'Enter comment' },
	'Ich habe den': { 'de-ch': 'Ich habe den', 'en-us': 'I have read the' },
	'gelesen und akzeptiere diesen.': {
		'de-ch': 'gelesen und akzeptiere diesen.',
		'en-us': 'and accept it.'
	},
	Haftungsausschluss: { 'de-ch': 'Haftungsausschluss', 'en-us': 'Disclaimer' },
	'Wird geladen…': { 'de-ch': 'Wird geladen…', 'en-us': 'Loading…' },

	// GlobaleEvents
	'Online-Veranstaltung': { 'de-ch': 'Online-Veranstaltung', 'en-us': 'Online Event' },
	'Auf Karte anzeigen': { 'de-ch': 'Auf Karte anzeigen', 'en-us': 'View on map' },
	bis: { 'de-ch': 'bis', 'en-us': 'to' },
	'Einlass ab': { 'de-ch': 'Einlass ab', 'en-us': 'Doors open at' },
	Kostenlos: { 'de-ch': 'Kostenlos', 'en-us': 'Free' },
	'Anmeldung erforderlich': { 'de-ch': 'Anmeldung erforderlich', 'en-us': 'Registration required' },
	Anmelden: { 'de-ch': 'Anmelden', 'en-us': 'Register' },
	Ticket: { 'de-ch': 'Ticket', 'en-us': 'Ticket' },
	Tickets: { 'de-ch': 'Tickets', 'en-us': 'Tickets' },
	Veranstalter: { 'de-ch': 'Veranstalter', 'en-us': 'Organizer' },
	Sprache: { 'de-ch': 'Sprache', 'en-us': 'Language' },
	Zielgruppe: { 'de-ch': 'Zielgruppe', 'en-us': 'Target audience' },
	Mindestalter: { 'de-ch': 'Mindestalter', 'en-us': 'Minimum age' },
	'Mind. Teilnehmer': { 'de-ch': 'Mind. Teilnehmer', 'en-us': 'Min. participants' },
	'Max. Teilnehmer': { 'de-ch': 'Max. Teilnehmer', 'en-us': 'Max. participants' },
	'Als PDF herunterladen': { 'de-ch': 'Als PDF herunterladen', 'en-us': 'Download as PDF' },
	Status: { 'de-ch': 'Status', 'en-us': 'Status' },
	Termine: { 'de-ch': 'Termine', 'en-us': 'Dates' },
	'Datum noch nicht festgelegt': {
		'de-ch': 'Datum noch nicht festgelegt',
		'en-us': 'Date not yet set'
	},
	Anmeldung: { 'de-ch': 'Anmeldung', 'en-us': 'Registration' },
	'Wähle deine bevorzugte Methode zur Anmeldung:': {
		'de-ch': 'Wähle deine bevorzugte Methode zur Anmeldung:',
		'en-us': 'Choose your preferred method to register:'
	},
	'Per E-Mail': { 'de-ch': 'Per E-Mail', 'en-us': 'Via E-Mail' },
	'Per WhatsApp': { 'de-ch': 'Per WhatsApp', 'en-us': 'Via WhatsApp' },
	'Per Telegram': { 'de-ch': 'Per Telegram', 'en-us': 'Via Telegram' },
	Schliessen: { 'de-ch': 'Schliessen', 'en-us': 'Close' },
	Link: { 'de-ch': 'Link', 'en-us': 'Link' },
	// Event Status
	Geplant: { 'de-ch': 'Geplant', 'en-us': 'Scheduled' },
	Bestätigt: { 'de-ch': 'Bestätigt', 'en-us': 'Confirmed' },
	Abgesagt: { 'de-ch': 'Abgesagt', 'en-us': 'Cancelled' },
	Verschoben: { 'de-ch': 'Verschoben', 'en-us': 'Postponed' },
	Ausgebucht: { 'de-ch': 'Ausgebucht', 'en-us': 'Sold Out' },
	'Anmeldefrist abgelaufen': { 'de-ch': 'Anmeldefrist abgelaufen', 'en-us': 'Registration closed' },
	Bestellübersicht: { 'de-ch': 'Bestellübersicht', 'en-us': 'Order Summary' },
	Einmalig: { 'de-ch': 'Einmalig', 'en-us': 'One-time' },
	Monatlich: { 'de-ch': 'Monatlich', 'en-us': 'Monthly' },
	Jährlich: { 'de-ch': 'Jährlich', 'en-us': 'Annually' },
	'auf Anfrage': { 'de-ch': 'auf Anfrage', 'en-us': 'on request' },
	Total: { 'de-ch': 'Total', 'en-us': 'Total' },
	Gesamttotal: { 'de-ch': 'Gesamttotal', 'en-us': 'Grand total' },
	Jahr: { 'de-ch': 'Jahr', 'en-us': 'year' },
	Monat: { 'de-ch': 'Monat', 'en-us': 'month' },
	'Abrechnungsart:': { 'de-ch': 'Abrechnungsart:', 'en-us': 'Billing type:' },
	'exkl. MwSt.': { 'de-ch': 'exkl. MwSt.', 'en-us': 'excl. VAT' },
	'Code angewendet:': { 'de-ch': 'Code angewendet:', 'en-us': 'Code applied:' },
	'Ich habe die': { 'de-ch': 'Ich habe die', 'en-us': 'I have read the' },
	'und die': { 'de-ch': 'und die', 'en-us': 'and the' },
	'gelesen und akzeptiere diese.': {
		'de-ch': 'gelesen und akzeptiere diese.',
		'en-us': 'and accept them.'
	},
	'Gehostet auf': { 'de-ch': 'Gehostet auf', 'en-us': 'Hosted on' },
	'Chat öffnen': { 'de-ch': 'Chat öffnen', 'en-us': 'Open chat' },
	'Chat schliessen': { 'de-ch': 'Chat schliessen', 'en-us': 'Close chat' },
	'Nachricht eingeben': { 'de-ch': 'Nachricht eingeben…', 'en-us': 'Type a message…' },
	Senden: { 'de-ch': 'Senden', 'en-us': 'Send' },
	Tippt: { 'de-ch': 'Tippt…', 'en-us': 'Typing…' },
	'Beispiel Firma GmbH': { 'de-ch': 'Beispiel Firma GmbH', 'en-us': 'Example Corp Ltd' },
	'Check-in': { 'de-ch': 'Check-in', 'en-us': 'Check-in' },
	'Check-out': { 'de-ch': 'Check-out', 'en-us': 'Check-out' },
	LinkListe: { 'de-ch': 'LinkListe', 'en-us': 'Link List' },
	PlanFilter: { 'de-ch': 'PlanFilter', 'en-us': 'Plan Filter' },
	RessourceBuchung: { 'de-ch': 'RessourceBuchung', 'en-us': 'Resource Booking' },
	'Multi (Mehrere Zeilen)': {
		'de-ch': 'Multi (Mehrere Zeilen)',
		'en-us': 'Multi (Multiple Lines)'
	},
	Farbverlauf: { 'de-ch': 'Farbverlauf', 'en-us': 'Gradient' },
	Einzelzitat: { 'de-ch': 'Einzelzitat', 'en-us': 'Single Quote' },
	Testimonials: { 'de-ch': 'Testimonials', 'en-us': 'Testimonials' },
	'Kartenhöhe (px)': { 'de-ch': 'Kartenhöhe (px)', 'en-us': 'Card Height (px)' },
	'Schrift horizontal zentrieren': {
		'de-ch': 'Schrift horizontal zentrieren',
		'en-us': 'Center text horizontally'
	},
	'Karte links': { 'de-ch': 'Karte links', 'en-us': 'Card left' },
	Tabellenwerkzeuge: { 'de-ch': 'Tabellenwerkzeuge', 'en-us': 'Table tools' },
	Suche: { 'de-ch': 'Suche', 'en-us': 'Search' },
	'Feld, Name oder Beschreibung': {
		'de-ch': 'Feld, Name oder Beschreibung',
		'en-us': 'Field, name or description'
	},
	'Element Typ': { 'de-ch': 'Element Typ', 'en-us': 'Element type' },
	Alle: { 'de-ch': 'Alle', 'en-us': 'All' },
	'Page Type': { 'de-ch': 'Page Type', 'en-us': 'Page Type' },
	'Custom Type': { 'de-ch': 'Custom Type', 'en-us': 'Custom Type' },
	Slice: { 'de-ch': 'Slice', 'en-us': 'Slice' },
	'Sortieren nach': { 'de-ch': 'Sortieren nach', 'en-us': 'Sort by' },
	'Tab / Variante': { 'de-ch': 'Tab / Variante', 'en-us': 'Tab / Variant' },
	Feld: { 'de-ch': 'Feld', 'en-us': 'Field' },
	Typ: { 'de-ch': 'Typ', 'en-us': 'Type' },
	'Absteigend sortieren': { 'de-ch': 'Absteigend sortieren', 'en-us': 'Sort descending' },
	'Aufsteigend sortieren': { 'de-ch': 'Aufsteigend sortieren', 'en-us': 'Sort ascending' },
	Zurücksetzen: { 'de-ch': 'Zurücksetzen', 'en-us': 'Reset' },
	von: { 'de-ch': 'von', 'en-us': 'of' },
	Feldern: { 'de-ch': 'Feldern', 'en-us': 'fields' },
	'Keine aktiven Felder für diesen Branch gefunden.': {
		'de-ch': 'Keine aktiven Felder für diesen Branch gefunden.',
		'en-us': 'No active fields found for this branch.'
	},
	'Keine Felder für diese Auswahl gefunden.': {
		'de-ch': 'Keine Felder für diese Auswahl gefunden.',
		'en-us': 'No fields found for this selection.'
	},
	Seitennavigation: { 'de-ch': 'Seitennavigation', 'en-us': 'Pagination' },
	'Vorherige Seite': { 'de-ch': 'Vorherige Seite', 'en-us': 'Previous page' },
	'Nächste Seite': { 'de-ch': 'Nächste Seite', 'en-us': 'Next page' },
	// Agency Gating Editor
	'Agency Gating Editor': { 'de-ch': 'Agency Gating Editor', 'en-us': 'Agency Gating Editor' },
	'Bitte geben Sie das Agentur-Passwort ein:': {
		'de-ch': 'Bitte geben Sie das Agentur-Passwort ein:',
		'en-us': 'Please enter the agency password:'
	},
	Passwort: { 'de-ch': 'Passwort', 'en-us': 'Password' },
	'Passwort eingeben': { 'de-ch': 'Passwort eingeben', 'en-us': 'Enter password' },
	Features: { 'de-ch': 'Features', 'en-us': 'Features' },
	'im Plan': { 'de-ch': 'im Plan', 'en-us': 'in plan' },
	'Fehlende Umgebungsvariablen': {
		'de-ch': 'Fehlende Umgebungsvariablen',
		'en-us': 'Missing environment variables'
	},
	'Admin-Bereiche': { 'de-ch': 'Admin-Bereiche', 'en-us': 'Admin sections' },
	Speichern: { 'de-ch': 'Speichern', 'en-us': 'Save' },
	Übersicht: { 'de-ch': 'Übersicht', 'en-us': 'Overview' },
	'Plan-Features': { 'de-ch': 'Plan-Features', 'en-us': 'Plan features' },
	keine: { 'de-ch': 'keine', 'en-us': 'none' },
	'Ausgewählte Features': { 'de-ch': 'Ausgewählte Features', 'en-us': 'Selected features' },
	Zusätzlich: { 'de-ch': 'Zusätzlich', 'en-us': 'Additional' },
	Entfernt: { 'de-ch': 'Entfernt', 'en-us': 'Removed' },
	'Plan-Definition (global)': {
		'de-ch': 'Plan-Definition (global)',
		'en-us': 'Plan definition (global)'
	},
	'Ändert gating.json – gilt nach Commit und Merge für alle Branches bzw. Kunden, nicht nur für dieses Projekt.':
		{
			'de-ch':
				'Ändert gating.json – gilt nach Commit und Merge für alle Branches bzw. Kunden, nicht nur für dieses Projekt.',
			'en-us':
				'Changes gating.json – after commit and merge it applies to all branches/customers, not just this project.'
		},
	'Mehrere Pläne': { 'de-ch': 'Mehrere Pläne', 'en-us': 'Multiple plans' },
	ab: { 'de-ch': 'ab', 'en-us': 'from' },
	'Plan-Definition speichern': {
		'de-ch': 'Plan-Definition speichern',
		'en-us': 'Save plan definition'
	},
	'aktives Feature mit fehlenden Umgebungsvariablen': {
		'de-ch': 'aktives Feature mit fehlenden Umgebungsvariablen',
		'en-us': 'active feature with missing environment variables'
	},
	'aktive Features mit fehlenden Umgebungsvariablen': {
		'de-ch': 'aktive Features mit fehlenden Umgebungsvariablen',
		'en-us': 'active features with missing environment variables'
	},
	'Details anzeigen': { 'de-ch': 'Details anzeigen', 'en-us': 'Show details' },
	'Für folgende aktive Features sind benötigte Umgebungsvariablen nicht gesetzt. Die betroffenen Funktionen (z.B. E-Mail-Versand, Datenbankzugriff) werden nicht funktionieren.':
		{
			'de-ch':
				'Für folgende aktive Features sind benötigte Umgebungsvariablen nicht gesetzt. Die betroffenen Funktionen (z.B. E-Mail-Versand, Datenbankzugriff) werden nicht funktionieren.',
			'en-us':
				'Required environment variables are not set for the following active features. The affected functions (e.g. email sending, database access) will not work.'
		},
	Setzen: { 'de-ch': 'Setzen', 'en-us': 'Set' },
	'Lokal in der Datei': { 'de-ch': 'Lokal in der Datei', 'en-us': 'Locally in the file' },
	'auf Netlify unter': { 'de-ch': 'auf Netlify unter', 'en-us': 'on Netlify under' },
	'Hinweis: Einzelne Variablen (z.B. EMAIL_FROM_ADDRESS) haben CMS-Fallbacks – ohne sie greifen die Fallbacks bzw. der Versand entfällt.':
		{
			'de-ch':
				'Hinweis: Einzelne Variablen (z.B. EMAIL_FROM_ADDRESS) haben CMS-Fallbacks – ohne sie greifen die Fallbacks bzw. der Versand entfällt.',
			'en-us':
				'Note: Some variables (e.g. EMAIL_FROM_ADDRESS) have CMS fallbacks – without them the fallbacks apply or sending is skipped.'
		},
	Verstanden: { 'de-ch': 'Verstanden', 'en-us': 'Got it' },
	'Gating-Übersicht': { 'de-ch': 'Gating-Übersicht', 'en-us': 'Gating overview' },
	'Falsches Passwort': { 'de-ch': 'Falsches Passwort', 'en-us': 'Wrong password' },
	'Gate in gating.json': { 'de-ch': 'Gate in gating.json', 'en-us': 'Gate in gating.json' },
	oder: { 'de-ch': 'oder', 'en-us': 'or' },
	'Alle Einträge aus gating.json: welche Custom Types, Slices, Variationen und Felder zu welchem Feature bzw. Plan gehören. Abgeblendet = mit der aktuellen Auswahl inaktiv.':
		{
			'de-ch':
				'Alle Einträge aus gating.json: welche Custom Types, Slices, Variationen und Felder zu welchem Feature bzw. Plan gehören. Abgeblendet = mit der aktuellen Auswahl inaktiv.',
			'en-us':
				'All entries from gating.json: which custom types, slices, variations and fields belong to which feature or plan. Dimmed = inactive with the current selection.'
		},
	'Unbekannte Features oder Pläne referenziert': {
		'de-ch': 'Unbekannte Features oder Pläne referenziert',
		'en-us': 'Unknown features or plans referenced'
	},
	'Nach Feature': { 'de-ch': 'Nach Feature', 'en-us': 'By feature' },
	'Nach Plan (ohne Feature)': {
		'de-ch': 'Nach Plan (ohne Feature)',
		'en-us': 'By plan (without feature)'
	},
	'Keine Zuordnung in gating.json (nur im Code abgefragt)': {
		'de-ch': 'Keine Zuordnung in gating.json (nur im Code abgefragt)',
		'en-us': 'No assignment in gating.json (checked in code only)'
	},
	'Custom Types': { 'de-ch': 'Custom Types', 'en-us': 'Custom types' },
	'Custom-Type-Felder': { 'de-ch': 'Custom-Type-Felder', 'en-us': 'Custom type fields' },
	'Tab-Overlays': { 'de-ch': 'Tab-Overlays', 'en-us': 'Tab overlays' },
	Slices: { 'de-ch': 'Slices', 'en-us': 'Slices' },
	'Slice-Variationen': { 'de-ch': 'Slice-Variationen', 'en-us': 'Slice variations' },
	'Slice-Felder': { 'de-ch': 'Slice-Felder', 'en-us': 'Slice fields' },
	// Cookie consent
	'Verwendete Cookies und Dienste': {
		'de-ch': 'Verwendete Cookies und Dienste',
		'en-us': 'Cookies and services used'
	},
	Zweck: { 'de-ch': 'Zweck', 'en-us': 'Purpose' },
	'Cookies / Daten': { 'de-ch': 'Cookies / Daten', 'en-us': 'Cookies / data' },
	'Nicht-funktionale Dienste können Sie jederzeit ablehnen oder wieder zulassen': {
		'de-ch': 'Nicht-funktionale Dienste können Sie jederzeit ablehnen oder wieder zulassen',
		'en-us': 'You can decline or re-allow non-functional services at any time'
	},
	'Auf dieser Seite werden keine Dienste dieser Kategorie verwendet.': {
		'de-ch': 'Auf dieser Seite werden keine Dienste dieser Kategorie verwendet.',
		'en-us': 'No services of this category are used on this page.'
	},
	'Cookie-Einstellungen': { 'de-ch': 'Cookie-Einstellungen', 'en-us': 'Cookie settings' },
	'Cookie-Hinweis': { 'de-ch': 'Cookie-Hinweis', 'en-us': 'Cookie notice' },
	'Cookies & externe Inhalte': {
		'de-ch': 'Cookies & externe Inhalte',
		'en-us': 'Cookies & external content'
	},
	'Diese Seite lädt Inhalte von Drittanbietern': {
		'de-ch': 'Diese Seite lädt Inhalte von Drittanbietern',
		'en-us': 'This page loads content from third parties'
	},
	'Dabei können Cookies gesetzt und Daten wie Ihre IP-Adresse übertragen werden. Sie können dies jederzeit ablehnen.':
		{
			'de-ch':
				'Dabei können Cookies gesetzt und Daten wie Ihre IP-Adresse übertragen werden. Sie können dies jederzeit ablehnen.',
			'en-us':
				'This may set cookies and transmit data such as your IP address. You can decline this at any time.'
		},
	Ablehnen: { 'de-ch': 'Ablehnen', 'en-us': 'Decline' },
	Einstellungen: { 'de-ch': 'Einstellungen', 'en-us': 'Settings' },
	Einverstanden: { 'de-ch': 'Einverstanden', 'en-us': 'Accept' },
	'Hier sehen Sie, welche Cookies und Dienste diese Website verwendet. Nicht-funktionale Dienste können Sie ablehnen.':
		{
			'de-ch':
				'Hier sehen Sie, welche Cookies und Dienste diese Website verwendet. Nicht-funktionale Dienste können Sie ablehnen.',
			'en-us':
				'Here you can see which cookies and services this website uses. You can decline non-functional services.'
		},
	'Immer aktiv': { 'de-ch': 'Immer aktiv', 'en-us': 'Always active' },
	'auf dieser Seite': { 'de-ch': 'auf dieser Seite', 'en-us': 'on this page' },
	'Datenschutz des Anbieters': {
		'de-ch': 'Datenschutz des Anbieters',
		'en-us': "Provider's privacy policy"
	},
	'Alle ablehnen': { 'de-ch': 'Alle ablehnen', 'en-us': 'Decline all' },
	'Auswahl speichern': { 'de-ch': 'Auswahl speichern', 'en-us': 'Save selection' },
	'Dieser Inhalt wird nicht geladen, weil Sie externe Inhalte abgelehnt haben.': {
		'de-ch': 'Dieser Inhalt wird nicht geladen, weil Sie externe Inhalte abgelehnt haben.',
		'en-us': 'This content is not loaded because you declined external content.'
	},
	'Beim Laden werden Daten an folgenden Anbieter übertragen': {
		'de-ch': 'Beim Laden werden Daten an folgenden Anbieter übertragen',
		'en-us': 'Loading it transmits data to the following provider'
	},
	'Einmal laden': { 'de-ch': 'Einmal laden', 'en-us': 'Load once' },
	'Immer erlauben': { 'de-ch': 'Immer erlauben', 'en-us': 'Always allow' },
	Funktional: { 'de-ch': 'Funktional', 'en-us': 'Functional' },
	'Für den Betrieb der Website erforderlich (z.B. Anmeldung, geschützte Seiten, Ihre Cookie-Auswahl). Können nicht deaktiviert werden.':
		{
			'de-ch':
				'Für den Betrieb der Website erforderlich (z.B. Anmeldung, geschützte Seiten, Ihre Cookie-Auswahl). Können nicht deaktiviert werden.',
			'en-us':
				'Required for the website to work (e.g. login, protected pages, your cookie choice). Cannot be disabled.'
		},
	'Externe Inhalte': { 'de-ch': 'Externe Inhalte', 'en-us': 'External content' },
	'Karten, Videos und andere eingebettete Inhalte von Drittanbietern. Diese können Cookies setzen und erhalten Ihre IP-Adresse.':
		{
			'de-ch':
				'Karten, Videos und andere eingebettete Inhalte von Drittanbietern. Diese können Cookies setzen und erhalten Ihre IP-Adresse.',
			'en-us':
				'Maps, videos and other embedded third-party content. These may set cookies and receive your IP address.'
		},
	Statistik: { 'de-ch': 'Statistik', 'en-us': 'Statistics' },
	'Anonyme oder pseudonyme Auswertung der Nutzung dieser Website.': {
		'de-ch': 'Anonyme oder pseudonyme Auswertung der Nutzung dieser Website.',
		'en-us': 'Anonymous or pseudonymous analysis of how this website is used.'
	},
	Marketing: { 'de-ch': 'Marketing', 'en-us': 'Marketing' },
	'Werbung und Wiedererkennung über verschiedene Websites hinweg.': {
		'de-ch': 'Werbung und Wiedererkennung über verschiedene Websites hinweg.',
		'en-us': 'Advertising and recognition across different websites.'
	},
	Benutzerkonto: { 'de-ch': 'Benutzerkonto', 'en-us': 'User account' },
	'Website-Betreiber': { 'de-ch': 'Website-Betreiber', 'en-us': 'Website operator' },
	'Hält Sie nach der Anmeldung in Ihrem Benutzerkonto angemeldet.': {
		'de-ch': 'Hält Sie nach der Anmeldung in Ihrem Benutzerkonto angemeldet.',
		'en-us': 'Keeps you signed in to your user account.'
	},
	'klap_user_session (Cookie)': {
		'de-ch': 'klap_user_session (Cookie)',
		'en-us': 'klap_user_session (cookie)'
	},
	'Passwortgeschützte Seiten': {
		'de-ch': 'Passwortgeschützte Seiten',
		'en-us': 'Password-protected pages'
	},
	'Merkt sich die Freigabe passwortgeschützter Seiten.': {
		'de-ch': 'Merkt sich die Freigabe passwortgeschützter Seiten.',
		'en-us': 'Remembers access to password-protected pages.'
	},
	'klap_auth (Cookie)': { 'de-ch': 'klap_auth (Cookie)', 'en-us': 'klap_auth (cookie)' },
	'Cookie-Auswahl': { 'de-ch': 'Cookie-Auswahl', 'en-us': 'Cookie choice' },
	'Speichert Ihre Auswahl in diesem Cookie-Dialog.': {
		'de-ch': 'Speichert Ihre Auswahl in diesem Cookie-Dialog.',
		'en-us': 'Stores your choice in this cookie dialog.'
	},
	'klap_consent (Local Storage)': {
		'de-ch': 'klap_consent (Local Storage)',
		'en-us': 'klap_consent (local storage)'
	},
	'Anzeige interaktiver Karten.': {
		'de-ch': 'Anzeige interaktiver Karten.',
		'en-us': 'Display of interactive maps.'
	},
	'Google-Cookies (z.B. NID)': {
		'de-ch': 'Google-Cookies (z.B. NID)',
		'en-us': 'Google cookies (e.g. NID)'
	},
	'Übertragung der IP-Adresse an Google': {
		'de-ch': 'Übertragung der IP-Adresse an Google',
		'en-us': 'Transmission of your IP address to Google'
	},
	'Wiedergabe eingebetteter Videos.': {
		'de-ch': 'Wiedergabe eingebetteter Videos.',
		'en-us': 'Playback of embedded videos.'
	},
	'YouTube-Cookies (z.B. VISITOR_INFO1_LIVE, YSC)': {
		'de-ch': 'YouTube-Cookies (z.B. VISITOR_INFO1_LIVE, YSC)',
		'en-us': 'YouTube cookies (e.g. VISITOR_INFO1_LIVE, YSC)'
	},
	'Vimeo-Cookies (z.B. vuid)': {
		'de-ch': 'Vimeo-Cookies (z.B. vuid)',
		'en-us': 'Vimeo cookies (e.g. vuid)'
	},
	'Übertragung der IP-Adresse an Vimeo': {
		'de-ch': 'Übertragung der IP-Adresse an Vimeo',
		'en-us': 'Transmission of your IP address to Vimeo'
	},
	'Eingebetteter Inhalt': { 'de-ch': 'Eingebetteter Inhalt', 'en-us': 'Embedded content' },
	Drittanbieter: { 'de-ch': 'Drittanbieter', 'en-us': 'Third party' },
	'Anzeige von Inhalten, die von einer externen Website geladen werden.': {
		'de-ch': 'Anzeige von Inhalten, die von einer externen Website geladen werden.',
		'en-us': 'Display of content loaded from an external website.'
	},
	'Cookies des Anbieters möglich': {
		'de-ch': 'Cookies des Anbieters möglich',
		'en-us': 'Provider cookies possible'
	},
	'Übertragung der IP-Adresse an den Anbieter': {
		'de-ch': 'Übertragung der IP-Adresse an den Anbieter',
		'en-us': 'Transmission of your IP address to the provider'
	},
	'Google Maps': { 'de-ch': 'Google Maps', 'en-us': 'Google Maps' },
	OpenStreetMap: { 'de-ch': 'OpenStreetMap', 'en-us': 'OpenStreetMap' },
	Dailymotion: { 'de-ch': 'Dailymotion', 'en-us': 'Dailymotion' },
	'Dailymotion SA': { 'de-ch': 'Dailymotion SA', 'en-us': 'Dailymotion SA' },
	'Dailymotion-Cookies (z.B. dmvk, ts)': {
		'de-ch': 'Dailymotion-Cookies (z.B. dmvk, ts)',
		'en-us': 'Dailymotion cookies (e.g. dmvk, ts)'
	},
	'Übertragung der IP-Adresse an Dailymotion': {
		'de-ch': 'Übertragung der IP-Adresse an Dailymotion',
		'en-us': 'Transmission of your IP address to Dailymotion'
	},
	SoundCloud: { 'de-ch': 'SoundCloud', 'en-us': 'SoundCloud' },
	'SoundCloud Global Limited & Co. KG': {
		'de-ch': 'SoundCloud Global Limited & Co. KG',
		'en-us': 'SoundCloud Global Limited & Co. KG'
	},
	'Wiedergabe eingebetteter Audioinhalte.': {
		'de-ch': 'Wiedergabe eingebetteter Audioinhalte.',
		'en-us': 'Playback of embedded audio content.'
	},
	'SoundCloud-Cookies (z.B. sc_anonymous_id)': {
		'de-ch': 'SoundCloud-Cookies (z.B. sc_anonymous_id)',
		'en-us': 'SoundCloud cookies (e.g. sc_anonymous_id)'
	},
	'Übertragung der IP-Adresse an SoundCloud': {
		'de-ch': 'Übertragung der IP-Adresse an SoundCloud',
		'en-us': 'Transmission of your IP address to SoundCloud'
	},
	Spotify: { 'de-ch': 'Spotify', 'en-us': 'Spotify' },
	'Spotify AB': { 'de-ch': 'Spotify AB', 'en-us': 'Spotify AB' },
	'Spotify-Cookies (z.B. sp_t)': {
		'de-ch': 'Spotify-Cookies (z.B. sp_t)',
		'en-us': 'Spotify cookies (e.g. sp_t)'
	},
	'Übertragung der IP-Adresse an Spotify': {
		'de-ch': 'Übertragung der IP-Adresse an Spotify',
		'en-us': 'Transmission of your IP address to Spotify'
	},
	'Ungültige Video-URL': { 'de-ch': 'Ungültige Video-URL', 'en-us': 'Invalid video URL' },
	'Medienlink öffnen': { 'de-ch': 'Medienlink öffnen', 'en-us': 'Open media link' },
	Video: { 'de-ch': 'Video', 'en-us': 'Video' },
	'OpenStreetMap Foundation': {
		'de-ch': 'OpenStreetMap Foundation',
		'en-us': 'OpenStreetMap Foundation'
	},
	'Keine Tracking-Cookies': { 'de-ch': 'Keine Tracking-Cookies', 'en-us': 'No tracking cookies' },
	'Übertragung der IP-Adresse an die OpenStreetMap Foundation': {
		'de-ch': 'Übertragung der IP-Adresse an die OpenStreetMap Foundation',
		'en-us': 'Transmission of your IP address to the OpenStreetMap Foundation'
	},
	YouTube: { 'de-ch': 'YouTube', 'en-us': 'YouTube' },
	Vimeo: { 'de-ch': 'Vimeo', 'en-us': 'Vimeo' },
	'Google Ireland Ltd. / Google LLC': {
		'de-ch': 'Google Ireland Ltd. / Google LLC',
		'en-us': 'Google Ireland Ltd. / Google LLC'
	},
	'Vimeo.com Inc.': { 'de-ch': 'Vimeo.com Inc.', 'en-us': 'Vimeo.com Inc.' },
	// Newsletter / Admin-Dashboard
	'Zurück zum Dashboard': { 'de-ch': 'Zurück zum Dashboard', 'en-us': 'Back to dashboard' },
	Newsletter: { 'de-ch': 'Newsletter', 'en-us': 'Newsletter' },
	'Info-Mails an alle Kunden senden. Die Mails verfassen Sie in Prismic (Typ „Newsletter“) und veröffentlichen sie dort – danach erscheinen sie hier.':
		{
			'de-ch':
				'Info-Mails an alle Kunden senden. Die Mails verfassen Sie in Prismic (Typ „Newsletter“) und veröffentlichen sie dort – danach erscheinen sie hier.',
			'en-us':
				'Send info mails to all customers. Write them in Prismic (type “Newsletter”) and publish them there – they will then appear here.'
		},
	'E-Mail-Versand nicht konfiguriert: RESEND_API_KEY und EMAIL_FROM_ADDRESS fehlen.': {
		'de-ch': 'E-Mail-Versand nicht konfiguriert: RESEND_API_KEY und EMAIL_FROM_ADDRESS fehlen.',
		'en-us': 'Email sending not configured: RESEND_API_KEY and EMAIL_FROM_ADDRESS are missing.'
	},
	'Test-Mail gesendet an': { 'de-ch': 'Test-Mail gesendet an', 'en-us': 'Test mail sent to' },
	'Info-Mail gesendet an': { 'de-ch': 'Info-Mail gesendet an', 'en-us': 'Info mail sent to' },
	Empfänger: { 'de-ch': 'Empfänger', 'en-us': 'recipients' },
	Abgemeldet: { 'de-ch': 'Abgemeldet', 'en-us': 'Unsubscribed' },
	Versände: { 'de-ch': 'Versände', 'en-us': 'Sends' },
	'Noch keine veröffentlichten Newsletter. Legen Sie in Prismic ein Dokument vom Typ „Newsletter“ an und veröffentlichen Sie es.':
		{
			'de-ch':
				'Noch keine veröffentlichten Newsletter. Legen Sie in Prismic ein Dokument vom Typ „Newsletter“ an und veröffentlichen Sie es.',
			'en-us':
				'No published newsletters yet. Create a document of type “Newsletter” in Prismic and publish it.'
		},
	'Newsletter wählen': { 'de-ch': 'Newsletter wählen', 'en-us': 'Choose newsletter' },
	'Vorschau öffnen': { 'de-ch': 'Vorschau öffnen', 'en-us': 'Open preview' },
	'Dieser Newsletter wurde bereits versendet': {
		'de-ch': 'Dieser Newsletter wurde bereits versendet',
		'en-us': 'This newsletter has already been sent'
	},
	'1. Test-Mail an mich': { 'de-ch': '1. Test-Mail an mich', 'en-us': '1. Test mail to me' },
	'Test-Adresse': { 'de-ch': 'Test-Adresse', 'en-us': 'Test address' },
	'Wird gesendet …': { 'de-ch': 'Wird gesendet …', 'en-us': 'Sending …' },
	'Test senden': { 'de-ch': 'Test senden', 'en-us': 'Send test' },
	'2. An alle Kunden senden': {
		'de-ch': '2. An alle Kunden senden',
		'en-us': '2. Send to all customers'
	},
	'Ich möchte diesen Newsletter jetzt an': {
		'de-ch': 'Ich möchte diesen Newsletter jetzt an',
		'en-us': 'I want to send this newsletter to'
	},
	'senden.': { 'de-ch': 'senden.', 'en-us': 'now.' },
	'Jetzt senden': { 'de-ch': 'Jetzt senden', 'en-us': 'Send now' },
	Verlauf: { 'de-ch': 'Verlauf', 'en-us': 'History' },
	Datum: { 'de-ch': 'Datum', 'en-us': 'Date' },
	Betreff: { 'de-ch': 'Betreff', 'en-us': 'Subject' },
	Fehler: { 'de-ch': 'Fehler', 'en-us': 'Errors' },
	'Jede Mail enthält Ihre Absender-Angaben und einen Abmelde-Link. Abgemeldete Adressen werden automatisch ausgeschlossen.':
		{
			'de-ch':
				'Jede Mail enthält Ihre Absender-Angaben und einen Abmelde-Link. Abgemeldete Adressen werden automatisch ausgeschlossen.',
			'en-us':
				'Every mail contains your sender details and an unsubscribe link. Unsubscribed addresses are excluded automatically.'
		},
	'Admin Dashboard': { 'de-ch': 'Admin Dashboard', 'en-us': 'Admin dashboard' },
	Dashboard: { 'de-ch': 'Dashboard', 'en-us': 'Dashboard' },
	Rechnungen: { 'de-ch': 'Rechnungen', 'en-us': 'Invoices' },
	'Rechnungen erstellen, bearbeiten, versenden (E-Commerce + Manuell)': {
		'de-ch': 'Rechnungen erstellen, bearbeiten, versenden (E-Commerce + Manuell)',
		'en-us': 'Create, edit and send invoices (e-commerce + manual)'
	},
	Kunden: { 'de-ch': 'Kunden', 'en-us': 'Customers' },
	'Bestellungen und Kundendaten einsehen, neue Kunden erfassen': {
		'de-ch': 'Bestellungen und Kundendaten einsehen, neue Kunden erfassen',
		'en-us': 'View orders and customer data, add new customers'
	},
	Terminverwaltung: { 'de-ch': 'Terminverwaltung', 'en-us': 'Appointments' },
	'Buchungen anzeigen, löschen, Termine sperren': {
		'de-ch': 'Buchungen anzeigen, löschen, Termine sperren',
		'en-us': 'View and delete bookings, block time slots'
	},
	'Ressource-Buchungen': { 'de-ch': 'Ressource-Buchungen', 'en-us': 'Resource bookings' },
	'Ferienhäuser, Räume etc. — Buchungen einsehen und löschen': {
		'de-ch': 'Ferienhäuser, Räume etc. — Buchungen einsehen und löschen',
		'en-us': 'Holiday homes, rooms etc. — view and delete bookings'
	},
	'Angenommene Aufgaben bestätigen und als erledigt markieren': {
		'de-ch': 'Angenommene Aufgaben bestätigen und als erledigt markieren',
		'en-us': 'Confirm accepted tasks and mark them as done'
	},
	'Event Anmeldungen': { 'de-ch': 'Event Anmeldungen', 'en-us': 'Event registrations' },
	'Anmeldungen aus Event-Checkouts einsehen, gruppiert nach Event': {
		'de-ch': 'Anmeldungen aus Event-Checkouts einsehen, gruppiert nach Event',
		'en-us': 'View registrations from event checkouts, grouped by event'
	},
	'Info-Mails aus Prismic an alle Kunden senden': {
		'de-ch': 'Info-Mails aus Prismic an alle Kunden senden',
		'en-us': 'Send info mails from Prismic to all customers'
	},
	'Alle geschützten Seiten anzeigen und ohne Passwortabfrage öffnen': {
		'de-ch': 'Alle geschützten Seiten anzeigen und ohne Passwortabfrage öffnen',
		'en-us': 'Show all protected pages and open them without password'
	},
	'Info-Mails abbestellen': {
		'de-ch': 'Info-Mails abbestellen',
		'en-us': 'Unsubscribe from info mails'
	},
	'Sie wurden abgemeldet und erhalten keine weiteren Info-Mails mehr.': {
		'de-ch': 'Sie wurden abgemeldet und erhalten keine weiteren Info-Mails mehr.',
		'en-us': 'You have been unsubscribed and will not receive any further info mails.'
	},
	'Dieser Abmelde-Link ist ungültig. Bitte verwenden Sie den Link aus der E-Mail.': {
		'de-ch': 'Dieser Abmelde-Link ist ungültig. Bitte verwenden Sie den Link aus der E-Mail.',
		'en-us': 'This unsubscribe link is invalid. Please use the link from the email.'
	},
	'Möchten Sie für diese E-Mail-Adresse keine weiteren Info-Mails erhalten?': {
		'de-ch': 'Möchten Sie für diese E-Mail-Adresse keine weiteren Info-Mails erhalten?',
		'en-us': 'Do you want to stop receiving info mails at this email address?'
	},
	'Web-Ansicht der Info-Mail – Platzhalter mit Beispiel-Empfänger': {
		'de-ch': 'Web-Ansicht der Info-Mail – Platzhalter mit Beispiel-Empfänger',
		'en-us': 'Web view of the info mail – placeholders filled with an example recipient'
	},
	'Sie erhalten diese E-Mail als Kundin oder Kunde von': {
		'de-ch': 'Sie erhalten diese E-Mail als Kundin oder Kunde von',
		'en-us': 'You are receiving this email as a customer of'
	},
	'Keine weiteren Info-Mails erhalten': {
		'de-ch': 'Keine weiteren Info-Mails erhalten',
		'en-us': 'Unsubscribe from info mails'
	},
	'Ungültiger Abmelde-Link': {
		'de-ch': 'Ungültiger Abmelde-Link',
		'en-us': 'Invalid unsubscribe link'
	},
	'Die Abmeldung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.': {
		'de-ch': 'Die Abmeldung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.',
		'en-us': 'Unsubscribing failed. Please try again later.'
	},
	'Newsletter und Test-Adresse angeben': {
		'de-ch': 'Newsletter und Test-Adresse angeben',
		'en-us': 'Specify newsletter and test address'
	},
	'Newsletter nicht gefunden': {
		'de-ch': 'Newsletter nicht gefunden',
		'en-us': 'Newsletter not found'
	},
	'Bitte den Versand bestätigen': {
		'de-ch': 'Bitte den Versand bestätigen',
		'en-us': 'Please confirm sending'
	},
	'Keine Empfänger vorhanden': {
		'de-ch': 'Keine Empfänger vorhanden',
		'en-us': 'No recipients available'
	},
	'2. An ausgewählte Kunden senden': {
		'de-ch': '2. An ausgewählte Kunden senden',
		'en-us': '2. Send to selected customers'
	},
	'3. An alle Kunden senden': {
		'de-ch': '3. An alle Kunden senden',
		'en-us': '3. Send to all customers'
	},
	'Kunden suchen …': { 'de-ch': 'Kunden suchen …', 'en-us': 'Search customers …' },
	'Alle auswählen': { 'de-ch': 'Alle auswählen', 'en-us': 'Select all' },
	'Keine Kunden gefunden': { 'de-ch': 'Keine Kunden gefunden', 'en-us': 'No customers found' },
	'ausgewählte Empfänger': { 'de-ch': 'ausgewählte Empfänger', 'en-us': 'selected recipients' },
	'An Auswahl senden': { 'de-ch': 'An Auswahl senden', 'en-us': 'Send to selection' },
	'Versand an': { 'de-ch': 'Versand an', 'en-us': 'Sent to' },
	Auswahl: { 'de-ch': 'Auswahl', 'en-us': 'Selection' },
	'Bitte mindestens einen Kunden auswählen': {
		'de-ch': 'Bitte mindestens einen Kunden auswählen',
		'en-us': 'Please select at least one customer'
	},
	// Admin: Kunden
	'wirklich löschen?': { 'de-ch': 'wirklich löschen?', 'en-us': 'really delete?' },
	'Kunde erfasst': { 'de-ch': 'Kunde erfasst', 'en-us': 'Customer added' },
	'Fehler beim Erfassen': { 'de-ch': 'Fehler beim Erfassen', 'en-us': 'Error while adding' },
	'Unbekannter Fehler': { 'de-ch': 'Unbekannter Fehler', 'en-us': 'Unknown error' },
	'Server-Fehler': { 'de-ch': 'Server-Fehler', 'en-us': 'Server error' },
	'Sprache konnte nicht gespeichert werden': {
		'de-ch': 'Sprache konnte nicht gespeichert werden',
		'en-us': 'Language could not be saved'
	},
	Kundenliste: { 'de-ch': 'Kundenliste', 'en-us': 'Customer list' },
	'Alle Kunden löschen?': { 'de-ch': 'Alle Kunden löschen?', 'en-us': 'Delete all customers?' },
	'Alle löschen': { 'de-ch': 'Alle löschen', 'en-us': 'Delete all' },
	'Formular schliessen': { 'de-ch': 'Formular schliessen', 'en-us': 'Close form' },
	'Neuer Kunde': { 'de-ch': 'Neuer Kunde', 'en-us': 'New customer' },
	'Wird gespeichert …': { 'de-ch': 'Wird gespeichert …', 'en-us': 'Saving …' },
	'Noch keine Einträge.': { 'de-ch': 'Noch keine Einträge.', 'en-us': 'No entries yet.' },
	Löschen: { 'de-ch': 'Löschen', 'en-us': 'Delete' },
	Quelle: { 'de-ch': 'Quelle', 'en-us': 'Source' },
	'Manuell erfasst': { 'de-ch': 'Manuell erfasst', 'en-us': 'Added manually' },
	Terminbuchung: { 'de-ch': 'Terminbuchung', 'en-us': 'Appointment booking' },
	'E-Commerce': { 'de-ch': 'E-Commerce', 'en-us': 'E-commerce' },
	'Kunde fehlt': { 'de-ch': 'Kunde fehlt', 'en-us': 'Customer missing' },
	'Unbekannte Sprache': { 'de-ch': 'Unbekannte Sprache', 'en-us': 'Unknown language' },
	// Newsletter-Anmeldung (Double-Opt-in)
	'Fast geschafft! Wir haben Ihnen eine E-Mail geschickt. Bitte bestätigen Sie Ihre Anmeldung über den Link darin.':
		{
			'de-ch':
				'Fast geschafft! Wir haben Ihnen eine E-Mail geschickt. Bitte bestätigen Sie Ihre Anmeldung über den Link darin.',
			'en-us':
				'Almost done! We have sent you an email. Please confirm your sign-up using the link in it.'
		},
	'Ich möchte Info-Mails erhalten. Die Einwilligung kann ich jederzeit über den Abmelde-Link in jeder E-Mail widerrufen.':
		{
			'de-ch':
				'Ich möchte Info-Mails erhalten. Die Einwilligung kann ich jederzeit über den Abmelde-Link in jeder E-Mail widerrufen.',
			'en-us':
				'I would like to receive info mails. I can withdraw my consent at any time via the unsubscribe link in every email.'
		},
	'Bitte bestätigen Sie, dass Sie Info-Mails erhalten möchten.': {
		'de-ch': 'Bitte bestätigen Sie, dass Sie Info-Mails erhalten möchten.',
		'en-us': 'Please confirm that you would like to receive info mails.'
	},
	'Die Anmeldung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.': {
		'de-ch': 'Die Anmeldung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.',
		'en-us': 'The sign-up failed. Please try again later.'
	},
	'Bitte geben Sie eine gültige E-Mail-Adresse ein.': {
		'de-ch': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
		'en-us': 'Please enter a valid email address.'
	},
	'Anmeldung bestätigen': { 'de-ch': 'Anmeldung bestätigen', 'en-us': 'Confirm sign-up' },
	'Vielen Dank! Ihre Anmeldung ist bestätigt. Sie erhalten ab jetzt unsere Info-Mails.': {
		'de-ch': 'Vielen Dank! Ihre Anmeldung ist bestätigt. Sie erhalten ab jetzt unsere Info-Mails.',
		'en-us': 'Thank you! Your sign-up is confirmed. You will now receive our info mails.'
	},
	'Dieser Bestätigungslink ist ungültig oder abgelaufen.': {
		'de-ch': 'Dieser Bestätigungslink ist ungültig oder abgelaufen.',
		'en-us': 'This confirmation link is invalid or has expired.'
	},
	'Bitte melden Sie sich erneut an.': {
		'de-ch': 'Bitte melden Sie sich erneut an.',
		'en-us': 'Please sign up again.'
	},
	'Bitte bestätigen Sie die Anmeldung für die Info-Mails mit dieser E-Mail-Adresse:': {
		'de-ch': 'Bitte bestätigen Sie die Anmeldung für die Info-Mails mit dieser E-Mail-Adresse:',
		'en-us': 'Please confirm the sign-up for info mails with this email address:'
	},
	'Die Bestätigung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.': {
		'de-ch': 'Die Bestätigung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.',
		'en-us': 'The confirmation failed. Please try again later.'
	},
	'Sie erhalten diese E-Mail, weil Sie die Info-Mails abonniert haben von': {
		'de-ch': 'Sie erhalten diese E-Mail, weil Sie die Info-Mails abonniert haben von',
		'en-us': 'You are receiving this email because you subscribed to the info mails of'
	},
	'Bitte bestätigen Sie Ihre Anmeldung für die Info-Mails': {
		'de-ch': 'Bitte bestätigen Sie Ihre Anmeldung für die Info-Mails',
		'en-us': 'Please confirm your sign-up for the info mails'
	},
	'Guten Tag': { 'de-ch': 'Guten Tag', 'en-us': 'Hello' },
	'Sie haben sich für die Info-Mails angemeldet. Bitte bestätigen Sie Ihre Anmeldung mit einem Klick auf den Button. Der Link ist 7 Tage gültig.':
		{
			'de-ch':
				'Sie haben sich für die Info-Mails angemeldet. Bitte bestätigen Sie Ihre Anmeldung mit einem Klick auf den Button. Der Link ist 7 Tage gültig.',
			'en-us':
				'You have signed up for the info mails. Please confirm your sign-up by clicking the button. The link is valid for 7 days.'
		},
	'Falls Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail einfach.': {
		'de-ch': 'Falls Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail einfach.',
		'en-us': 'If you did not sign up, simply ignore this email.'
	},
	Abonnent: { 'de-ch': 'Abonnent', 'en-us': 'Subscriber' },
	// Newsletter: Abonnenten-Übersicht
	'Abonnent wirklich entfernen? Die Adresse erhält danach keine Info-Mails mehr.': {
		'de-ch': 'Abonnent wirklich entfernen? Die Adresse erhält danach keine Info-Mails mehr.',
		'en-us': 'Really remove subscriber? The address will no longer receive info mails.'
	},
	'Abonnent entfernt': { 'de-ch': 'Abonnent entfernt', 'en-us': 'Subscriber removed' },
	Abonnenten: { 'de-ch': 'Abonnenten', 'en-us': 'Subscribers' },
	'Als CSV exportieren': { 'de-ch': 'Als CSV exportieren', 'en-us': 'Export as CSV' },
	'Anmeldungen über das Formular „Newsletter abonnieren“ (bestätigt per E-Mail). Das Bestätigungsdatum ist der Nachweis der Einwilligung.':
		{
			'de-ch':
				'Anmeldungen über das Formular „Newsletter abonnieren“ (bestätigt per E-Mail). Das Bestätigungsdatum ist der Nachweis der Einwilligung.',
			'en-us':
				'Sign-ups via the “Subscribe to newsletter” form (confirmed by email). The confirmation date is the proof of consent.'
		},
	'Noch keine Abonnenten.': { 'de-ch': 'Noch keine Abonnenten.', 'en-us': 'No subscribers yet.' },
	'Abonnenten suchen …': { 'de-ch': 'Abonnenten suchen …', 'en-us': 'Search subscribers …' },
	'Bestätigt am': { 'de-ch': 'Bestätigt am', 'en-us': 'Confirmed on' },
	abgemeldet: { 'de-ch': 'abgemeldet', 'en-us': 'unsubscribed' },
	aktiv: { 'de-ch': 'aktiv', 'en-us': 'active' },
	'Keine Abonnenten gefunden': {
		'de-ch': 'Keine Abonnenten gefunden',
		'en-us': 'No subscribers found'
	},
	'Abonnent nicht gefunden': {
		'de-ch': 'Abonnent nicht gefunden',
		'en-us': 'Subscriber not found'
	},
	'Anmeldung bestätigt': { 'de-ch': 'Anmeldung bestätigt', 'en-us': 'Sign-up confirmed' },
	// Admin-Login
	Admin: { 'de-ch': 'Admin', 'en-us': 'Admin' },
	'Falsches Passwort.': { 'de-ch': 'Falsches Passwort.', 'en-us': 'Wrong password.' }
};

/**
 * Die Helper-Funktion für Logik-Teile (Vorschlag 1)
 * Nutzt den Key als Fallback, falls keine Übersetzung existiert.
 */
export function t(key: string, lang: string): string {
	const entry = translations[key];
	if (!entry) {
		if (dev) console.warn(`[i18n] Fehlender Key: "${key}"`);
		return key;
	}

	// Wir suchen eine passende Übersetzung (z.B. 'en' findet 'en-us')
	const langBase = lang.split('-')[0]; // 'en' oder 'de'
	const foundKey = Object.keys(entry).find((k) => k.startsWith(langBase));

	return entry[foundKey || ''] || entry['de-ch'] || key;
}
