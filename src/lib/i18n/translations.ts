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
	'Verfügbarkeit wird geladen…': { 'de-ch': 'Verfügbarkeit wird geladen…', 'en-us': 'Loading availability…' },
	Nacht: { 'de-ch': 'Nacht', 'en-us': 'night' },
	Nächte: { 'de-ch': 'Nächte', 'en-us': 'nights' },
	Schlafzimmer: { 'de-ch': 'Schlafzimmer', 'en-us': 'Bedrooms' },
	'Bereits gebucht': { 'de-ch': 'Bereits gebucht', 'en-us': 'Already booked' },
	'Voll belegt': { 'de-ch': 'Voll belegt', 'en-us': 'Fully booked' },
	'Teilweise belegt': { 'de-ch': 'Teilweise belegt', 'en-us': 'Partially booked' },
	'Frei': { 'de-ch': 'Frei', 'en-us': 'Available' },
	'Gewählter Zeitraum': { 'de-ch': 'Gewählter Zeitraum', 'en-us': 'Selected period' },
	Zimmerauswahl: { 'de-ch': 'Zimmerauswahl', 'en-us': 'Room selection' },
	'Ausgewählte Zimmer': { 'de-ch': 'Ausgewählte Zimmer', 'en-us': 'Selected rooms' },
	Belegt: { 'de-ch': 'Belegt', 'en-us': 'Unavailable' },
	'Alle gewählten Zimmer sind in diesem Zeitraum belegt': { 'de-ch': 'Alle gewählten Zimmer sind in diesem Zeitraum belegt', 'en-us': 'All selected rooms are booked in this period' },
	'Bitte mindestens ein Zimmer auswählen': { 'de-ch': 'Bitte mindestens ein Zimmer auswählen', 'en-us': 'Please select at least one room' },
	'Ausgewählte Zimmer bieten Platz für maximal': { 'de-ch': 'Ausgewählte Zimmer bieten Platz für maximal', 'en-us': 'Selected rooms accommodate a maximum of' },
	Kapazität: { 'de-ch': 'Kapazität', 'en-us': 'Capacity' },
	Mindestaufenthalt: { 'de-ch': 'Mindestaufenthalt', 'en-us': 'Minimum stay' },
	'Für den gewünschten Zeitraum sind nur noch einzelne Zimmer buchbar': { 'de-ch': 'Für den gewünschten Zeitraum sind nur noch einzelne Zimmer buchbar', 'en-us': 'Only individual rooms are available for the selected period' },
	'Preis pro Nacht ab': { 'de-ch': 'Preis pro Nacht ab', 'en-us': 'Price per night from' },
	'Jetzt anfragen': { 'de-ch': 'Jetzt anfragen', 'en-us': 'Request now' },
	'Freundes-Referenz-E-Mail Adresse': { 'de-ch': 'Freundes-Referenz-E-Mail Adresse', 'en-us': 'Friend referral email address' },
	'Wird geprüft…': { 'de-ch': 'Wird geprüft…', 'en-us': 'Checking…' },
	'E-Mail gefunden': { 'de-ch': 'E-Mail gefunden', 'en-us': 'Email found' },
	'E-Mail nicht gefunden': { 'de-ch': 'E-Mail nicht gefunden', 'en-us': 'Email not found' },
	'Wird gesendet…': { 'de-ch': 'Wird gesendet…', 'en-us': 'Sending…' },
	'Anfrage erhalten!': { 'de-ch': 'Anfrage erhalten!', 'en-us': 'Request received!' },
	'Wir melden uns in Kürze bei Ihnen.': { 'de-ch': 'Wir melden uns in Kürze bei Ihnen.', 'en-us': 'We will get back to you shortly.' },
	'Abreise muss nach Anreise liegen': { 'de-ch': 'Abreise muss nach Anreise liegen', 'en-us': 'Check-out must be after check-in' },
	'Dieser Zeitraum ist bereits belegt': { 'de-ch': 'Dieser Zeitraum ist bereits belegt', 'en-us': 'This period is already booked' },
	'Dieser Zeitraum ist leider nicht mehr verfügbar': { 'de-ch': 'Dieser Zeitraum ist leider nicht mehr verfügbar', 'en-us': 'This period is unfortunately no longer available' },
	'Ein Fehler ist aufgetreten': { 'de-ch': 'Ein Fehler ist aufgetreten', 'en-us': 'An error occurred' },
	'Keine Ressource verknüpft': { 'de-ch': 'Keine Ressource verknüpft', 'en-us': 'No resource linked' },
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
	GoogleMapEinbetten: { 'de-ch': 'GoogleMapEinbetten', 'en-us': 'Embed Google Map' },
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
	'Abstand oben / unten gleich': {
		'de-ch': 'Abstand oben / unten gleich',
		'en-us': 'Equal top/bottom spacing'
	},
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
	'Buchungsreferenz': {
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
	'Abschicken': {
		'de-ch': 'Abschicken',
		'en-us': 'Submit'
	},
	'Kommentar': {
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
	'Mit Buchungs-ID anmelden': { 'de-ch': 'Mit Buchungs-ID anmelden', 'en-us': 'Log in with booking ID' },
	Aufgabenliste: { 'de-ch': 'Aufgabenliste', 'en-us': 'Task list' },
	'Bitte melde dich mit der Buchungs-ID an, die du per E-Mail erhalten hast.': {
		'de-ch': 'Bitte melde dich mit der Buchungs-ID an, die du per E-Mail erhalten hast.',
		'en-us': 'Please log in with the booking ID you received by email.'
	},
	Aufgaben: { 'de-ch': 'Aufgaben', 'en-us': 'Tasks' },
	'Aufgabe annehmen': { 'de-ch': 'Aufgabe annehmen', 'en-us': 'Accept task' },
	'Aufgabe abgeben': { 'de-ch': 'Aufgabe abgeben', 'en-us': 'Submit task' },
	'Aufgabe bereits angenommen': { 'de-ch': 'Aufgabe bereits angenommen', 'en-us': 'Task already accepted' },
	'Angenommen': { 'de-ch': 'Angenommen', 'en-us': 'Accepted' },
	Erledigt: { 'de-ch': 'Erledigt', 'en-us': 'Done' },
	'Credits verdient': { 'de-ch': 'Credits verdient', 'en-us': 'Credits earned' },
	'Geleistete Minuten': { 'de-ch': 'Geleistete Minuten', 'en-us': 'Minutes spent' },
	'Keine Aufgaben verfügbar': { 'de-ch': 'Keine Aufgaben verfügbar', 'en-us': 'No tasks available' },
	'Aufgabe konnte nicht angenommen werden': { 'de-ch': 'Aufgabe konnte nicht angenommen werden', 'en-us': 'Task could not be accepted' },
	'Abgabe fehlgeschlagen': { 'de-ch': 'Abgabe fehlgeschlagen', 'en-us': 'Submission failed' },
	'Einloggen': { 'de-ch': 'Anmelden', 'en-us': 'Log in' },
	'Ungültige Kombination von Buchungs-ID und E-Mail': { 'de-ch': 'Ungültige Kombination von Buchungs-ID und E-Mail', 'en-us': 'Invalid combination of booking ID and email' },
	'Meine Aufgaben': { 'de-ch': 'Meine Aufgaben', 'en-us': 'My tasks' },
	'Verfügbare Aufgaben': { 'de-ch': 'Verfügbare Aufgaben', 'en-us': 'Available tasks' },
	'Abmelden': { 'de-ch': 'Abmelden', 'en-us': 'Log out' },
	'Fest': { 'de-ch': 'Fest', 'en-us': 'Fixed' },
	'Zeitbasiert': { 'de-ch': 'Zeitbasiert', 'en-us': 'Time-based' },
	'Credit-Typ': { 'de-ch': 'Credit-Typ', 'en-us': 'Credit type' },
	'pro Nacht': { 'de-ch': 'pro Nacht', 'en-us': 'per night' },
	'Minuten eingeben': { 'de-ch': 'Minuten eingeben', 'en-us': 'Enter minutes' },
	'Benötigte Werkzeuge': { 'de-ch': 'Benötigte Werkzeuge', 'en-us': 'Required tools' },
	'Kommentar (optional)': { 'de-ch': 'Kommentar (optional)', 'en-us': 'Comment (optional)' },
	'Anhang (optional)': { 'de-ch': 'Anhang (optional)', 'en-us': 'Attachment (optional)' },
	'Kommentar eingeben': { 'de-ch': 'Kommentar eingeben', 'en-us': 'Enter comment' },
	'Ich habe den': { 'de-ch': 'Ich habe den', 'en-us': 'I have read the' },
	'gelesen und akzeptiere diesen.': { 'de-ch': 'gelesen und akzeptiere diesen.', 'en-us': 'and accept it.' },
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
	Tickets: { 'de-ch': 'Tickets', 'en-us': 'Tickets' },
	Veranstalter: { 'de-ch': 'Veranstalter', 'en-us': 'Organizer' },
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
	'Gehostet auf': { 'de-ch': 'Gehostet auf', 'en-us': 'Hosted on' }
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
