import type { RequestHandler } from '@sveltejs/kit';
import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from 'pdf-lib';

// ── Typen ────────────────────────────────────────────────────────────────────

export interface MietvertragDaten {
	// Vermieter
	vermieter_name: string;
	vermieter_adresse: string;
	vermieter_plz_ort: string;
	vermieter_telefon: string;
	vermieter_email: string;

	// Mieter
	mieter1_vorname: string;
	mieter1_name: string;
	mieter1_geburtsdatum: string;
	mieter1_bisherige_adresse: string;
	mieter1_plz_ort: string;
	mieter1_telefon: string;
	mieter1_email: string;
	mieter2_vorname: string;
	mieter2_name: string;
	mieter2_geburtsdatum: string;

	// Mietobjekt
	objekt_strasse: string;
	objekt_plz_ort: string;
	objekt_lage: string;
	objekt_art: string;
	objekt_zimmer: string;
	objekt_nebenraeume: string;

	// Mietdauer
	miet_beginn: string;
	miet_typ: 'unbefristet' | 'befristet';
	miet_ende: string;
	kuendigungsfrist: string;
	kuendigungstermine: string;

	// Mietzins
	nettomiete: string;
	nebenkosten: string;
	zahlungstag: string;

	// Kaution
	kaution_betrag: string;
	kaution_art: string;
	kaution_bank: string;

	// Übergabe
	uebergabe_datum: string;
	uebergabe_zustand: string;

	// Untermiete
	ist_untermiete?: boolean;
	untermieter1_vorname?: string;
	untermieter1_name?: string;
	untermieter1_geburtsdatum?: string;
	untermieter1_adresse?: string;
	untermieter1_plz_ort?: string;
	untermieter2_vorname?: string;
	untermieter2_name?: string;
	untermieter2_geburtsdatum?: string;
	untermieter2_adresse?: string;
	untermieter2_plz_ort?: string;
	untermieter3_vorname?: string;
	untermieter3_name?: string;
	untermieter3_geburtsdatum?: string;
	untermieter3_adresse?: string;
	untermieter3_plz_ort?: string;
	untermiet_raeume?: string;
	untermiet_zins?: string;

	// Abschluss
	ort: string;
	datum: string;
	bemerkungen: string;
}

// ── Farben & Konstanten ──────────────────────────────────────────────────────

const BLACK  = rgb(0,    0,    0   );
const DARK   = rgb(0.15, 0.15, 0.15);
const GRAY   = rgb(0.45, 0.45, 0.45);
const LGRAY  = rgb(0.82, 0.82, 0.82);
const LLGRAY = rgb(0.95, 0.95, 0.95);
const ACCENT = rgb(0.18, 0.25, 0.45);

const W  = 595;
const H  = 842;
const ML = 55;   // margin left
const MR = 540;  // margin right
const CW = MR - ML;
const MB = 55;   // margin bottom
const MT = H - 48; // start y

// ── PDF-Builder-Klasse ───────────────────────────────────────────────────────

class PdfBuilder {
	doc: PDFDocument;
	page!: PDFPage;
	y: number = MT;
	bold!: PDFFont;
	regular!: PDFFont;
	pageNum = 0;

	constructor(doc: PDFDocument, bold: PDFFont, regular: PDFFont) {
		this.doc = doc;
		this.bold = bold;
		this.regular = regular;
		this.addPage();
	}

	addPage() {
		this.page = this.doc.addPage([W, H]);
		this.y = MT;
		this.pageNum++;
		if (this.pageNum > 1) this.drawPageHeader();
	}

	checkY(needed: number) {
		if (this.y - needed < MB) this.addPage();
	}

	drawPageHeader() {
		this.page.drawText('MIETVERTRAG', {
			x: ML, y: MT + 4, size: 7, font: this.regular, color: GRAY
		});
		const pn = `Seite ${this.pageNum}`;
		const pw = this.regular.widthOfTextAtSize(pn, 7);
		this.page.drawText(pn, { x: MR - pw, y: MT + 4, size: 7, font: this.regular, color: GRAY });
		this.page.drawLine({ start: { x: ML, y: MT }, end: { x: MR, y: MT }, thickness: 0.4, color: LGRAY });
		this.y = MT - 14;
	}

	gap(pt: number) { this.y -= pt; }

	line(thickness = 0.5, color = LGRAY) {
		this.page.drawLine({ start: { x: ML, y: this.y }, end: { x: MR, y: this.y }, thickness, color });
		this.y -= 6;
	}

	wrapText(text: string, maxW: number, font: PDFFont, size: number): string[] {
		const words = text.split(' ');
		const lines: string[] = [];
		let cur = '';
		for (const w of words) {
			const test = cur ? `${cur} ${w}` : w;
			if (font.widthOfTextAtSize(test, size) > maxW && cur) {
				lines.push(cur);
				cur = w;
			} else {
				cur = test;
			}
		}
		if (cur) lines.push(cur);
		return lines;
	}

	text(t: string, opts: {
		x?: number; size?: number; font?: PDFFont; color?: typeof BLACK; newline?: boolean
	} = {}) {
		const { x = ML, size = 9, font = this.regular, color = DARK, newline = true } = opts;
		this.page.drawText(t, { x, y: this.y, size, font, color });
		if (newline) this.y -= size * 1.5;
	}

	textBlock(t: string, opts: {
		x?: number; maxW?: number; size?: number; font?: PDFFont; color?: typeof BLACK; leading?: number
	} = {}) {
		const { x = ML, maxW = CW, size = 9, font = this.regular, color = DARK, leading = 1.55 } = opts;
		const lines = this.wrapText(t, maxW, font, size);
		const lineH = size * leading;
		this.checkY(lines.length * lineH + 4);
		for (const l of lines) {
			this.page.drawText(l, { x, y: this.y, size, font, color });
			this.y -= lineH;
		}
	}

	sectionHeader(title: string) {
		this.checkY(28);
		this.gap(6);
		this.page.drawRectangle({ x: ML, y: this.y - 2, width: CW, height: 18, color: ACCENT });
		this.page.drawText(title, { x: ML + 6, y: this.y + 2, size: 9, font: this.bold, color: rgb(1,1,1) });
		this.y -= 22;
	}

	field(label: string, value: string, opts: { half?: boolean; x?: number; width?: number } = {}) {
		const x = opts.x ?? ML;
		const w = opts.width ?? (opts.half ? CW / 2 - 4 : CW);
		const lh = 9 * 1.4;

		this.checkY(32);

		this.page.drawText(label, { x, y: this.y, size: 7.5, font: this.regular, color: GRAY });
		this.y -= 11;

		// Unterline
		this.page.drawLine({
			start: { x, y: this.y },
			end: { x: x + w, y: this.y },
			thickness: 0.5, color: LGRAY
		});

		// Wert (wrapping wenn nötig)
		const lines = this.wrapText(value || '—', w - 4, this.regular, 9.5);
		for (const l of lines) {
			this.page.drawText(l, { x: x + 2, y: this.y - 1, size: 9.5, font: this.bold, color: BLACK });
			this.y -= lh;
		}
		this.y -= 4;
	}

	fieldRow(fields: Array<{ label: string; value: string; flex?: number }>) {
		const total = fields.reduce((s, f) => s + (f.flex ?? 1), 0);
		let x = ML;
		const startY = this.y;
		let minY = this.y;

		for (const f of fields) {
			const flex = f.flex ?? 1;
			const w = (CW / total) * flex - 4;
			this.y = startY;
			this.field(f.label, f.value, { x, width: w });
			if (this.y < minY) minY = this.y;
			x += (CW / total) * flex;
		}
		this.y = minY;
	}

	clauseTitle(title: string) {
		this.checkY(24);
		this.gap(4);
		this.page.drawText(title, { x: ML, y: this.y, size: 8.5, font: this.bold, color: ACCENT });
		this.y -= 13;
	}

	signatureLine(label: string, x: number, width: number) {
		this.page.drawLine({
			start: { x, y: this.y },
			end: { x: x + width, y: this.y },
			thickness: 0.5, color: DARK
		});
		this.page.drawText(label, { x, y: this.y - 10, size: 7.5, font: this.regular, color: GRAY });
	}
}

// ── Allgemeine Bedingungen ───────────────────────────────────────────────────

const KLAUSELN = [
	{
		titel: '§ 1  Vertragsgegenstand und Zweck',
		text: 'Das Mietobjekt wird ausschliesslich zum vereinbarten Zweck überlassen. Eine Zweckänderung bedarf der schriftlichen Zustimmung des Vermieters. Der Mieter ist verpflichtet, das Mietobjekt pfleglich und schonend zu behandeln sowie alle anwendbaren gesetzlichen Vorschriften zu beachten.'
	},
	{
		titel: '§ 2  Nebenkosten',
		text: 'Die vereinbarten Nebenkosten (Akonto) umfassen Heizung, Warmwasser und allgemeine Betriebskosten, sofern nicht anders vereinbart. Der Vermieter erstellt jährlich eine detaillierte Nebenkostenabrechnung. Über- oder Unterzahlungen werden mit der nächsten Mietzahlung verrechnet. Ergeben sich wesentliche Abweichungen, können die Akontobeiträge mit dreimonatiger Frist angepasst werden.'
	},
	{
		titel: '§ 3  Sorgfaltspflicht und Haftung',
		text: 'Der Mieter ist verpflichtet, mit dem Mietobjekt, den Gemeinschaftseinrichtungen und dem Hausrat des Vermieters sorgfältig umzugehen. Er haftet für alle Schäden, die er selbst, seine Haushaltangehörigen, Untermieter oder Besucher schuldhaft verursachen. Kleinere Reparaturen bis zum kantonal üblichen Betrag gehen zu Lasten des Mieters. Schäden sind dem Vermieter umgehend zu melden.'
	},
	{
		titel: '§ 4  Hausordnung und Rücksichtnahme',
		text: 'Der Mieter verpflichtet sich, die Hausordnung einzuhalten und auf die übrigen Bewohner Rücksicht zu nehmen. Ruhestörungen sind insbesondere zwischen 22:00 und 07:00 Uhr sowie an Sonn- und Feiertagen zu unterlassen. Das Halten von Haustieren ist nur mit ausdrücklicher schriftlicher Zustimmung des Vermieters gestattet.'
	},
	{
		titel: '§ 5  Untervermietung (OR Art. 262)',
		text: 'Die Untervermietung des Mietobjekts oder von Teilen davon bedarf der vorherigen schriftlichen Zustimmung des Vermieters. Der Vermieter kann die Zustimmung verweigern, wenn der Untermieter das Mietobjekt überbeanspruchen würde, dem Vermieter wesentliche Nachteile entstehen oder der Mieter einen übersetzten Untermietzins verlangen würde. Die Zustimmung entbindet den Mieter nicht von seinen Pflichten aus dem Hauptmietvertrag.'
	},
	{
		titel: '§ 6  Bauliche Veränderungen',
		text: 'Bauliche Veränderungen am Mietobjekt sind nur mit schriftlicher Zustimmung des Vermieters erlaubt. Bei Beendigung des Mietverhältnisses sind vorgenommene Veränderungen auf Verlangen des Vermieters zu beseitigen und der ursprüngliche Zustand wiederherzustellen, sofern nicht schriftlich anders vereinbart.'
	},
	{
		titel: '§ 7  Mietzinsanpassung (OR Art. 269 ff.)',
		text: 'Der Vermieter ist berechtigt, den Mietzins nach Massgabe der gesetzlichen Bestimmungen anzupassen, insbesondere bei Veränderungen des Referenzzinssatzes, der Teuerung oder der Orts- und Quartierüblichkeit. Eine Mietzinserhöhung ist mit dem amtlich genehmigten Formular anzukündigen und muss mindestens 10 Tage vor Beginn der Kündigungsfrist zugegangen sein. Der Mieter kann einen übersetzten Mietzins bei der zuständigen Schlichtungsbehörde anfechten.'
	},
	{
		titel: '§ 8  Kündigung (OR Art. 266 ff.)',
		text: 'Für Wohnräume hat die ordentliche Kündigung schriftlich mit dem amtlich genehmigten Formular zu erfolgen und muss der anderen Partei spätestens am letzten Tag vor Beginn der Kündigungsfrist zugehen. Bei missbräuchlicher Kündigung durch den Vermieter kann der Mieter innert 30 Tagen Erstreckung des Mietverhältnisses bei der Schlichtungsbehörde beantragen. Eine ausserordentliche Kündigung ist bei wichtigen Gründen mit einer Frist von 30 Tagen auf Ende eines Monats möglich (OR Art. 266g).'
	},
	{
		titel: '§ 9  Rückgabe des Mietobjekts',
		text: 'Bei Beendigung des Mietverhältnisses ist das Mietobjekt gereinigt, in ordnungsgemässem Zustand und mit sämtlichen Schlüsseln zurückzugeben. Schäden, die über die normale Abnutzung hinausgehen, sind durch den Mieter zu beheben oder deren Kosten zu ersetzen. Ein Übergabeprotokoll wird von beiden Parteien unterzeichnet. Allfällige Mängelrügen sind innert der gesetzlichen Fristen einzureichen.'
	},
	{
		titel: '§ 10  Kaution (OR Art. 257e)',
		text: 'Die Mietzinskaution ist auf einem Sperrkonto bei einer Bank auf den Namen des Mieters zu hinterlegen. Das Konto wird für die Dauer des Mietverhältnisses gesperrt. Der Zins fällt dem Mieter zu. Die Kaution darf drei Monats-Nettomieten nicht übersteigen. Nach Beendigung des Mietverhältnisses gibt der Vermieter die Kaution unter Vorbehalt allfälliger Forderungen innert 30 Tagen frei, spätestens jedoch nach Ablauf der gesetzlichen Verjährungsfrist für Mängel.'
	},
	{
		titel: '§ 11  Schlichtung und Rechtsweg',
		text: 'Bei Streitigkeiten aus dem Mietverhältnis ist zunächst die zuständige Schlichtungsbehörde am Ort des Mietobjekts anzurufen (ZPO Art. 197 ff.). Bei Wohnungsmiete ist die Vertretung durch einen Anwalt vor der Schlichtungsbehörde ausgeschlossen. Gerichtsstand ist der Ort des Mietobjekts. Es gilt ausschliesslich Schweizer Recht.'
	},
	{
		titel: '§ 12  Diverses',
		text: 'Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform; mündliche Nebenabreden sind nicht gültig. Sollten einzelne Bestimmungen nichtig oder unwirksam sein, bleiben die übrigen Bestimmungen davon unberührt. Die nichtigen Bestimmungen sind durch gültige zu ersetzen, die dem wirtschaftlichen Zweck am nächsten kommen. Dieser Vertrag untersteht dem Schweizer Obligationenrecht, insbesondere Art. 253 ff. OR.'
	}
];

// ── PDF generieren ───────────────────────────────────────────────────────────

async function generatePdf(d: MietvertragDaten): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
	const regular = await doc.embedFont(StandardFonts.Helvetica);
	const b = new PdfBuilder(doc, bold, regular);

	const brutto = (() => {
		const n = parseFloat(String(d.nettomiete));
		const nk = parseFloat(String(d.nebenkosten));
		if (!isNaN(n) && !isNaN(nk)) return `CHF ${(n + nk).toFixed(2)}`;
		if (!isNaN(n)) return `CHF ${n.toFixed(2)}`;
		return '';
	})();

	// ── Seite 1: Titel + Parteien ────────────────────────────────────────────

	// Titel
	b.page.drawRectangle({ x: 0, y: H - 70, width: W, height: 70, color: ACCENT });
	b.page.drawText('MIETVERTRAG', { x: ML, y: H - 34, size: 22, font: bold, color: rgb(1,1,1) });
	b.page.drawText('für Wohn- und Gewerberäume · Kanton Zürich', {
		x: ML, y: H - 52, size: 9, font: regular, color: rgb(0.78, 0.84, 0.95)
	});
	b.y = H - 84;

	// Vermieter
	b.sectionHeader('VERMIETER');
	b.fieldRow([
		{ label: 'Name / Firma', value: d.vermieter_name, flex: 2 },
		{ label: 'Telefon',      value: d.vermieter_telefon }
	]);
	b.fieldRow([
		{ label: 'Strasse und Hausnummer', value: d.vermieter_adresse, flex: 2 },
		{ label: 'E-Mail',                 value: d.vermieter_email }
	]);
	b.field('PLZ und Ort', d.vermieter_plz_ort, { width: CW / 2 });

	// Mieter
	b.gap(6);
	b.sectionHeader('MIETER');
	b.fieldRow([
		{ label: 'Vorname',        value: d.mieter1_vorname },
		{ label: 'Name',           value: d.mieter1_name },
		{ label: 'Geburtsdatum',   value: d.mieter1_geburtsdatum }
	]);

	if (d.mieter2_name || d.mieter2_vorname) {
		b.fieldRow([
			{ label: 'Vorname (2. Person)',      value: d.mieter2_vorname },
			{ label: 'Name (2. Person)',          value: d.mieter2_name },
			{ label: 'Geburtsdatum (2. Person)', value: d.mieter2_geburtsdatum }
		]);
	}

	b.fieldRow([
		{ label: 'Bisherige Adresse', value: d.mieter1_bisherige_adresse, flex: 2 },
		{ label: 'PLZ und Ort',       value: d.mieter1_plz_ort }
	]);
	b.fieldRow([
		{ label: 'Telefon', value: d.mieter1_telefon },
		{ label: 'E-Mail',  value: d.mieter1_email, flex: 2 }
	]);

	// ── Untermiete ───────────────────────────────────────────────────────────

	if (d.ist_untermiete) {
		b.gap(6);
		b.sectionHeader('UNTERMIETE (OR ART. 262)');

		const untermieter = [
			{ v: d.untermieter1_vorname, n: d.untermieter1_name, geb: d.untermieter1_geburtsdatum, adr: d.untermieter1_adresse, plz: d.untermieter1_plz_ort },
			{ v: d.untermieter2_vorname, n: d.untermieter2_name, geb: d.untermieter2_geburtsdatum, adr: d.untermieter2_adresse, plz: d.untermieter2_plz_ort },
			{ v: d.untermieter3_vorname, n: d.untermieter3_name, geb: d.untermieter3_geburtsdatum, adr: d.untermieter3_adresse, plz: d.untermieter3_plz_ort },
		].filter(u => u.v || u.n);

		untermieter.forEach((u, i) => {
			if (i > 0) b.gap(2);
			b.fieldRow([
				{ label: `Untermieter/in ${i + 1} Vorname`, value: u.v || '' },
				{ label: 'Name',                             value: u.n || '' },
				{ label: 'Geburtsdatum',                     value: u.geb || '' },
			]);
			b.fieldRow([
				{ label: 'Bisherige Adresse', value: u.adr || '', flex: 2 },
				{ label: 'PLZ und Ort',       value: u.plz || '' },
			]);
		});

		b.fieldRow([
			{ label: 'Untervermietete Räume / Teile', value: d.untermiet_raeume || '', flex: 2 },
			{ label: 'Untermietzins (CHF/Monat)',     value: d.untermiet_zins ? `CHF ${d.untermiet_zins}` : '' },
		]);

		b.checkY(20);
		b.textBlock(
			'Der Vermieter hat der Untervermietung gemäss OR Art. 262 schriftlich zugestimmt. Der Hauptmieter bleibt gegenüber dem Vermieter vollumfänglich für die Erfüllung aller Pflichten aus dem Hauptmietvertrag verantwortlich.',
			{ size: 8, color: GRAY }
		);
		b.gap(4);
	}

	// ── Mietobjekt ───────────────────────────────────────────────────────────

	b.gap(6);
	b.sectionHeader('MIETOBJEKT');
	b.fieldRow([
		{ label: 'Strasse und Hausnummer', value: d.objekt_strasse, flex: 2 },
		{ label: 'PLZ und Ort',            value: d.objekt_plz_ort }
	]);
	b.fieldRow([
		{ label: 'Lage (Etage / Ausrichtung)', value: d.objekt_lage },
		{ label: 'Art des Mietobjekts',        value: d.objekt_art },
		{ label: 'Anzahl Zimmer',              value: d.objekt_zimmer }
	]);
	b.field('Nebenräume (Keller, Estrich, Parkplatz usw.)', d.objekt_nebenraeume);

	// ── Seite 2: Vertragsbedingungen ─────────────────────────────────────────

	b.sectionHeader('MIETDAUER');
	b.fieldRow([
		{ label: 'Mietbeginn',  value: d.miet_beginn },
		{ label: 'Mietverhältnis', value: d.miet_typ === 'befristet'
			? `Befristet bis ${d.miet_ende}` : 'Unbefristet' },
		{ label: 'Kündigungsfrist', value: d.kuendigungsfrist ? `${d.kuendigungsfrist} Monate` : '' }
	]);
	b.field('Kündigungstermine', d.kuendigungstermine || '1. April und 1. Oktober');

	b.gap(4);
	b.sectionHeader('MIETZINS UND NEBENKOSTEN');
	b.fieldRow([
		{ label: 'Nettomiete (CHF/Monat)',    value: d.nettomiete ? `CHF ${d.nettomiete}` : '' },
		{ label: 'Nebenkosten Akonto (CHF/Monat)', value: d.nebenkosten ? `CHF ${d.nebenkosten}` : '' },
		{ label: 'Bruttomiete Total',         value: brutto }
	]);
	b.fieldRow([
		{ label: 'Zahlbar jeweils am', value: d.zahlungstag ? `${d.zahlungstag}. des Monats, im Voraus` : '' },
		{ label: 'Zahlungsweise',       value: 'Banküberweisung' }
	]);

	b.gap(4);
	b.sectionHeader('MIETZINSKAUTION');
	b.fieldRow([
		{ label: 'Kautionsbetrag (max. 3 Nettomieten)', value: d.kaution_betrag ? `CHF ${d.kaution_betrag}` : '' },
		{ label: 'Hinterlegungsart',                    value: d.kaution_art },
		{ label: 'Bank / Institut',                     value: d.kaution_bank }
	]);

	b.gap(4);
	b.sectionHeader('ÜBERGABE');
	b.fieldRow([
		{ label: 'Übergabedatum',              value: d.uebergabe_datum },
		{ label: 'Zustand des Mietobjekts',    value: d.uebergabe_zustand }
	]);

	if (d.bemerkungen?.trim()) {
		b.gap(4);
		b.sectionHeader('BESONDERE VEREINBARUNGEN');
		b.textBlock(d.bemerkungen, { size: 9 });
		b.gap(4);
	}

	// ── Allgemeine Vertragsbedingungen ───────────────────────────────────────

	b.checkY(60);
	b.gap(8);
	b.page.drawRectangle({ x: ML, y: b.y - 2, width: CW, height: 18, color: LLGRAY });
	b.page.drawText('ALLGEMEINE VERTRAGSBEDINGUNGEN', {
		x: ML + 6, y: b.y + 2, size: 9, font: bold, color: ACCENT
	});
	b.y -= 22;
	b.textBlock(
		'Dieser Vertrag untersteht dem Schweizer Recht, insbesondere den Bestimmungen des Obligationenrechts über die Miete von Wohn- und Geschäftsräumen (OR Art. 253–274g) sowie der Verordnung über die Miete und Pacht von Wohn- und Geschäftsräumen (VMWG). Die nachstehenden allgemeinen Bedingungen ergänzen die obigen Vereinbarungen.',
		{ size: 8, color: GRAY }
	);
	b.gap(6);

	for (const k of KLAUSELN) {
		b.clauseTitle(k.titel);
		b.textBlock(k.text, { size: 8.5, color: DARK, leading: 1.5 });
		b.gap(5);
	}

	// ── Unterschriften ───────────────────────────────────────────────────────

	b.checkY(110);
	b.gap(10);
	b.line(0.4, LGRAY);
	b.gap(4);

	b.page.drawText('DATUM UND UNTERSCHRIFTEN', {
		x: ML, y: b.y, size: 8, font: bold, color: ACCENT
	});
	b.y -= 16;

	b.page.drawText(`${d.ort || '___________________'}, ${d.datum || '___________________'}`, {
		x: ML, y: b.y, size: 9, font: regular, color: DARK
	});
	b.y -= 30;

	const hw = (CW - 20) / 2;

	// Vermieter
	b.signatureLine('Vermieter/in: Unterschrift', ML, hw);
	b.page.drawText(d.vermieter_name, { x: ML, y: b.y - 22, size: 8, font: regular, color: GRAY });

	// Mieter 1
	b.signatureLine('Mieter/in 1: Unterschrift', ML + hw + 20, hw);
	b.page.drawText(`${d.mieter1_vorname} ${d.mieter1_name}`.trim(),
		{ x: ML + hw + 20, y: b.y - 22, size: 8, font: regular, color: GRAY });

	b.y -= 46;

	// Mieter 2 falls vorhanden
	if (d.mieter2_name || d.mieter2_vorname) {
		b.signatureLine('Mieter/in 2: Unterschrift', ML, hw);
		b.page.drawText(`${d.mieter2_vorname} ${d.mieter2_name}`.trim(),
			{ x: ML, y: b.y - 22, size: 8, font: regular, color: GRAY });
		b.y -= 46;
	}

	// Untermieter-Unterschriften
	if (d.ist_untermiete) {
		const untermieterSig = [
			{ v: d.untermieter1_vorname, n: d.untermieter1_name },
			{ v: d.untermieter2_vorname, n: d.untermieter2_name },
			{ v: d.untermieter3_vorname, n: d.untermieter3_name },
		].filter(u => u.v || u.n);

		for (let i = 0; i < untermieterSig.length; i += 2) {
			b.checkY(60);
			const left  = untermieterSig[i];
			const right = untermieterSig[i + 1];
			b.signatureLine(`Untermieter/in ${i + 1}: Unterschrift`, ML, hw);
			b.page.drawText(`${left.v || ''} ${left.n || ''}`.trim(),
				{ x: ML, y: b.y - 22, size: 8, font: regular, color: GRAY });
			if (right) {
				b.signatureLine(`Untermieter/in ${i + 2}: Unterschrift`, ML + hw + 20, hw);
				b.page.drawText(`${right.v || ''} ${right.n || ''}`.trim(),
					{ x: ML + hw + 20, y: b.y - 22, size: 8, font: regular, color: GRAY });
			}
			b.y -= 46;
		}
	}

	b.gap(16);
	b.textBlock(
		'Hinweis: Dieser Mietvertrag basiert auf dem Schweizer Obligationenrecht (OR Art. 253 ff.). Für verbindliche Rechtsauskunft empfiehlt sich die Konsultation eines Rechtsanwalts oder des Mieter-/Hauseigentümerverbands.',
		{ size: 7, color: GRAY }
	);

	return doc.save();
}

// ── Request Handler ──────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request }) => {
	let data: MietvertragDaten;
	try {
		data = await request.json();
	} catch {
		return new Response('Ungültige Anfrage', { status: 400 });
	}

	const pdf = await generatePdf(data);

	const mieter = [data.mieter1_vorname, data.mieter1_name].filter(Boolean).join('_') || 'mieter';
	const filename = `Mietvertrag_${mieter}_${data.miet_beginn || 'ohne_datum'}.pdf`
		.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-.]/g, '');

	return new Response(pdf as unknown as BodyInit, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`,
		},
	});
};
