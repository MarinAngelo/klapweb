/**
 * Assistenz: import of an existing spreadsheet (LibreOffice .ods or CSV).
 *
 * Recognised layout (former spreadsheet and our own CSV export):
 *   «September 2026»                                   ← month title (first cell of the row)
 *   Person | Anstellung | Tagstunden | Nachtstunden …  ← header (column order free)
 *   <one row per person>
 *   «Monatstotal …» / empty title                      ← end of the block
 * Rates: cells «Tag CHF / Stunde» / «Nacht CHF / Stunde» followed by the value (spreadsheet),
 * or the rate line below the month title of our CSV export («Tag CHF 35.30 / Std. · …»).
 *
 * Two steps: «Prüfen» (dry run, report only) and «Importieren». Existing months are skipped
 * unless «überschreiben» is chosen; persons are matched by name, unknown ones are created.
 */
import { inflateRawSync } from 'zlib';
import {
	parseStunden,
	rappen,
	type Abzug,
	type Monat,
	type Saetze,
	type StundenEintrag
} from '$lib/assistenz';
import { loadConfig, loadMonat, neuePersonId, saveConfig, saveMonat } from './assistenz';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

/** i18n key with placeholders, translated in the browser */
export type Hinweis = { key: string; params?: Record<string, string> };

export type ImportZeile = { name: string; anstellung: string; tag?: number; nacht?: number };
export type ImportMonat = { monat: Monat; zeilen: ImportZeile[] };
export type ImportPlan = {
	monate: ImportMonat[];
	/** Unique, in file order */
	personen: { name: string; anstellung: string }[];
	saetze: Saetze[];
	hinweise: Hinweis[];
};

export type ImportStatus = 'neu' | 'vorhanden' | 'ueberschrieben' | 'leer';
export type ImportBericht = {
	angewendet: boolean;
	monate: { monat: Monat; status: ImportStatus; personen: number; tag: number; nacht: number }[];
	neuePersonen: string[];
	/** Rates from the file: taken over (only when none exist yet), ignored, or none found */
	saetze: 'neu' | 'vorhanden' | 'keine';
	saetzeListe: Saetze[];
	hinweise: Hinweis[];
};

// ── Reading the file ─────────────────────────────────────────────────────────

/** One file of a ZIP archive (ODS = ZIP), without a library */
function zipEntry(buf: Buffer, name: string): Buffer | null {
	let eocd = -1;
	for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
		if (buf.readUInt32LE(i) === 0x06054b50) {
			eocd = i;
			break;
		}
	}
	if (eocd < 0) return null;
	const count = buf.readUInt16LE(eocd + 10);
	let off = buf.readUInt32LE(eocd + 16);
	for (let n = 0; n < count && off + 46 <= buf.length; n++) {
		if (buf.readUInt32LE(off) !== 0x02014b50) return null;
		const method = buf.readUInt16LE(off + 10);
		const compressedSize = buf.readUInt32LE(off + 20);
		const nameLen = buf.readUInt16LE(off + 28);
		const extraLen = buf.readUInt16LE(off + 30);
		const commentLen = buf.readUInt16LE(off + 32);
		const localOffset = buf.readUInt32LE(off + 42);
		if (buf.toString('utf8', off + 46, off + 46 + nameLen) === name) {
			const start =
				localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28);
			const data = buf.subarray(start, start + compressedSize);
			if (method === 0) return data;
			if (method === 8) return inflateRawSync(data, { maxOutputLength: 50 * 1024 * 1024 });
			return null;
		}
		off += 46 + nameLen + extraLen + commentLen;
	}
	return null;
}

const decodeXml = (s: string) =>
	s
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
		.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
		.replace(/&amp;/g, '&');

const attr = (attrs: string, name: string) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];

const MAX_ROWS = 20000;
const MAX_REPEAT = 200;

/** Rows of all sheets of an ODS content.xml (numbers as exact values, not as displayed) */
function odsRows(xml: string): string[][] {
	const rows: string[][] = [];
	const rowRe = /<table:table-row(?=[\s/>])([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table-row>)/g;
	const cellRe =
		/<table:(?:covered-)?table-cell\b([^>]*?)(?:\/>|>([\s\S]*?)<\/table:(?:covered-)?table-cell>)/g;
	for (const row of xml.matchAll(rowRe)) {
		const cells: string[] = [];
		for (const cell of (row[2] ?? '').matchAll(cellRe)) {
			const repeat = Math.min(Number(attr(cell[1], 'table:number-columns-repeated') ?? 1), 1024);
			const value =
				attr(cell[1], 'office:value') ??
				decodeXml(
					(cell[2] ?? '')
						.replace(/<text:s\b[^>]*?text:c="(\d+)"[^>]*\/>/g, (_, n) => ' '.repeat(Number(n)))
						.replace(/<text:s\b[^>]*\/>/g, ' ')
						.replace(/<text:(tab|line-break)\b[^>]*\/>/g, ' ')
						.replace(/<\/text:p>\s*<text:p\b[^>]*>/g, '\n')
						.replace(/<[^>]+>/g, '')
				);
			if (value.trim() === '') {
				for (let i = 0; i < repeat; i++) cells.push('');
			} else {
				for (let i = 0; i < Math.min(repeat, MAX_REPEAT); i++) cells.push(value);
			}
		}
		// Trailing empty cells (e.g. 1000 repeated columns) are irrelevant
		while (cells.length && cells[cells.length - 1] === '') cells.pop();
		const repeatRows = Number(attr(row[1], 'table:number-rows-repeated') ?? 1);
		for (let i = 0; i < Math.min(repeatRows, cells.length ? MAX_REPEAT : 1); i++) rows.push(cells);
		if (rows.length > MAX_ROWS) break;
	}
	return rows;
}

function decodeText(buf: Buffer): string {
	let text: string;
	try {
		text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
	} catch {
		text = new TextDecoder('windows-1252').decode(buf); // Excel «CSV (Trennzeichen-getrennt)»
	}
	return text.replace(/^\uFEFF/, '');
}

/** CSV with ; , or tab (detected), quotes like Excel/LibreOffice */
function csvRows(text: string): string[][] {
	const sample = text.split(/\r?\n/).slice(0, 30).join('\n');
	const count = (c: string) => sample.split(c).length - 1;
	const delimiter = [';', '\t', ','].reduce((best, c) => (count(c) > count(best) ? c : best), ';');
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"' && text[i + 1] === '"') {
				cell += '"';
				i++;
			} else if (c === '"') quoted = false;
			else cell += c;
		} else if (c === '"') quoted = true;
		else if (c === delimiter) {
			row.push(cell);
			cell = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(cell);
			rows.push(row);
			row = [];
			cell = '';
			if (rows.length > MAX_ROWS) break;
		} else cell += c;
	}
	if (cell !== '' || row.length) rows.push([...row, cell]);
	return rows;
}

/** File → rows; error = i18n key */
export function leseDatei(name: string, buf: Buffer): { rows: string[][] } | { error: string } {
	const isZip = buf.length > 4 && buf.readUInt32LE(0) === 0x04034b50;
	if (isZip) {
		if (zipEntry(buf, 'xl/workbook.xml')) {
			return {
				error:
					'Excel-Dateien (.xlsx) bitte zuerst als CSV speichern (Datei › Speichern unter › CSV) oder in LibreOffice als .ods.'
			};
		}
		const content = zipEntry(buf, 'content.xml');
		if (!content) return { error: 'Die Datei konnte nicht gelesen werden.' };
		return { rows: odsRows(content.toString('utf8')) };
	}
	if (/\.(xls|xlsx|numbers|pdf)$/i.test(name)) {
		return {
			error:
				'Dieses Format wird nicht unterstützt. Bitte die Tabelle als .ods (LibreOffice) oder CSV speichern.'
		};
	}
	return { rows: csvRows(decodeText(buf)) };
}

// ── Recognising the layout ───────────────────────────────────────────────────

const MONATE: Record<string, number> = {
	januar: 1, jan: 1, january: 1,
	februar: 2, feb: 2, february: 2,
	märz: 3, maerz: 3, mär: 3, mrz: 3, march: 3, mar: 3,
	april: 4, apr: 4,
	mai: 5, may: 5,
	juni: 6, jun: 6, june: 6,
	juli: 7, jul: 7, july: 7,
	august: 8, aug: 8,
	september: 9, sept: 9, sep: 9,
	oktober: 10, okt: 10, october: 10, oct: 10,
	november: 11, nov: 11,
	dezember: 12, dez: 12, december: 12, dec: 12
}; // prettier-ignore

/** «September 2026» → «2026-09»; anything else (e.g. a title with more words) → null */
function monatAusTitel(text: string): Monat | null {
	const m = text
		.trim()
		.toLowerCase()
		.match(/^([a-zäöü]+)\.?\s+(\d{4})$/);
	const nr = m && MONATE[m[1]];
	return nr ? `${m[2]}-${String(nr).padStart(2, '0')}` : null;
}

/** «1'200.50», «35,3» → number; empty → undefined; invalid → NaN */
function zahl(raw: string | undefined): number | undefined {
	const s = (raw ?? '').replace(/['’\s]/g, '').replace(',', '.');
	if (s === '') return undefined;
	const n = Number(s);
	return Number.isFinite(n) ? n : NaN;
}

const satzSchluessel = (s: Omit<Saetze, 'gueltigAb'>) =>
	`${s.tag}|${s.nacht}|${JSON.stringify(s.abzuege)}`;

const istTotalZeile = (text: string) => /^(monatstotal|jahrestotal|total)\b/i.test(text.trim());

export function parseImport(rows: string[][]): ImportPlan {
	const monate = new Map<Monat, ImportMonat>();
	const personen = new Map<string, { name: string; anstellung: string }>();
	const hinweise: Hinweis[] = [];
	/** Rates line of our CSV export per month */
	const monatsSaetze = new Map<Monat, Omit<Saetze, 'gueltigAb'>>();
	let tagSatz: number | undefined;
	let nachtSatz: number | undefined;

	let aktuell: ImportMonat | null = null;
	let kopf: { name: number; anstellung: number; tag: number; nacht: number } | null = null;

	rows.forEach((raw, index) => {
		const cells = raw.map((c) => String(c ?? '').trim());
		const first = cells.find((c) => c !== '') ?? '';
		if (!first) return;
		const zeile = String(index + 1);

		// Rates of the former spreadsheet: label cell, value further right in the same row
		cells.forEach((c, i) => {
			const isTag = /^tag\s*chf\s*\/\s*stunde$/i.test(c);
			const isNacht = /^nacht\s*chf\s*\/\s*stunde$/i.test(c);
			if (!isTag && !isNacht) return;
			const wert = cells
				.slice(i + 1)
				.map(zahl)
				.find((n) => n !== undefined && !Number.isNaN(n));
			if (wert === undefined) return;
			if (isTag) tagSatz = wert;
			else nachtSatz = wert;
		});

		const monat = monatAusTitel(first);
		if (monat) {
			if (monate.has(monat)) {
				hinweise.push({
					key: 'Zeile {zeile}: {monat} kommt mehrfach vor.',
					params: { zeile, monat }
				});
			}
			aktuell = monate.get(monat) ?? { monat, zeilen: [] };
			monate.set(monat, aktuell);
			kopf = null;
			return;
		}

		// Rates line of our CSV export, right below the month title
		const satzZeile = first.match(/^Tag CHF ([\d'.,]+) \/ Std\. · Nacht CHF ([\d'.,]+) \/ Std\./);
		if (satzZeile && aktuell) {
			const abzuege: Abzug[] = [...first.matchAll(/·\s*([^·]+?)\s+([\d.,]+)\s*%/g)].map((m) => ({
				name: m[1].trim(),
				prozent: zahl(m[2]) ?? 0
			}));
			monatsSaetze.set(aktuell.monat, {
				tag: zahl(satzZeile[1]) ?? 0,
				nacht: zahl(satzZeile[2]) ?? 0,
				abzuege
			});
			return;
		}

		const lower = cells.map((c) => c.toLowerCase());
		if (lower.includes('person') && lower.includes('tagstunden')) {
			kopf = aktuell
				? {
						name: lower.indexOf('person'),
						anstellung: lower.indexOf('anstellung'),
						tag: lower.indexOf('tagstunden'),
						nacht: lower.indexOf('nachtstunden')
					}
				: null; // e.g. «Jahrestotal pro Person» of our export: not a month
			return;
		}

		if (istTotalZeile(first)) {
			aktuell = null;
			kopf = null;
			return;
		}
		if (!aktuell || !kopf) return;

		const name = cells[kopf.name] ?? '';
		if (!name) return;
		const anstellung = kopf.anstellung >= 0 ? (cells[kopf.anstellung] ?? '') : '';
		const lies = (spalte: number) => {
			if (spalte < 0) return undefined;
			const wert = zahl(cells[spalte]);
			if (wert === undefined) return undefined;
			const stunden = parseStunden(String(wert));
			if (stunden === undefined || Number.isNaN(stunden)) {
				hinweise.push({
					key: 'Zeile {zeile}: «{wert}» ist keine gültige Stundenzahl und wurde übersprungen.',
					params: { zeile, wert: cells[spalte] }
				});
				return undefined;
			}
			return stunden > 0 ? stunden : undefined;
		};
		const eintrag: ImportZeile = { name, anstellung, tag: lies(kopf.tag), nacht: lies(kopf.nacht) };

		const key = name.toLowerCase();
		const vorhanden = aktuell.zeilen.findIndex((z) => z.name.toLowerCase() === key);
		if (vorhanden >= 0) {
			hinweise.push({
				key: 'Zeile {zeile}: {name} steht im selben Monat mehrfach — die letzte Zeile gilt.',
				params: { zeile, name }
			});
			aktuell.zeilen[vorhanden] = eintrag;
		} else aktuell.zeilen.push(eintrag);

		const person = personen.get(key);
		if (!person) personen.set(key, { name, anstellung });
		else if (!person.anstellung && anstellung) person.anstellung = anstellung;
	});

	const sortiert = [...monate.values()].sort((a, b) => a.monat.localeCompare(b.monat));
	if (sortiert.length === 0) {
		hinweise.push({
			key: 'Keine Monate gefunden. Erwartet werden Blöcke mit einem Monatstitel (z.B. «September 2026») und der Kopfzeile «Person · Anstellung · Tagstunden · Nachtstunden».'
		});
	}

	// Rates: per month from our export (a new version whenever they change), else the spreadsheet's
	const saetze: Saetze[] = [];
	if (monatsSaetze.size) {
		for (const m of sortiert) {
			const s = monatsSaetze.get(m.monat);
			if (!s) continue;
			const vorher = saetze[saetze.length - 1];
			if (!vorher || satzSchluessel(vorher) !== satzSchluessel(s)) {
				saetze.push({ gueltigAb: m.monat, ...s });
			}
		}
	} else if (tagSatz !== undefined && nachtSatz !== undefined && sortiert.length) {
		saetze.push({
			gueltigAb: sortiert[0].monat,
			tag: rappen(tagSatz),
			nacht: rappen(nachtSatz),
			abzuege: []
		});
	}

	return { monate: sortiert, personen: [...personen.values()], saetze, hinweise };
}

// ── Applying ─────────────────────────────────────────────────────────────────

/** Dry run (anwenden = false) and import use the same code, so the preview matches the result */
export async function importAnwenden(
	plan: ImportPlan,
	{ anwenden, ueberschreiben }: { anwenden: boolean; ueberschreiben: boolean }
): Promise<ImportBericht> {
	const config = await loadConfig();
	const nachName = new Map(config.personen.map((p) => [p.name.trim().toLowerCase(), p]));
	const neuePersonen: string[] = [];
	for (const p of plan.personen) {
		const key = p.name.toLowerCase();
		if (nachName.has(key)) continue;
		const person = { id: neuePersonId(), name: p.name, anstellung: p.anstellung };
		config.personen.push(person);
		nachName.set(key, person);
		neuePersonen.push(p.name);
	}

	let saetze: ImportBericht['saetze'] = 'keine';
	if (plan.saetze.length) {
		saetze = config.saetze.length ? 'vorhanden' : 'neu';
		if (saetze === 'neu') config.saetze = plan.saetze;
	}
	if (anwenden && (neuePersonen.length || saetze === 'neu')) await saveConfig(config);

	const monate: ImportBericht['monate'] = [];
	for (const m of plan.monate) {
		const stunden: Record<string, StundenEintrag> = {};
		let tag = 0;
		let nacht = 0;
		for (const z of m.zeilen) {
			if (!z.tag && !z.nacht) continue;
			const person = nachName.get(z.name.toLowerCase());
			if (!person) continue;
			stunden[person.id] = { ...(z.tag && { tag: z.tag }), ...(z.nacht && { nacht: z.nacht }) };
			tag = rappen(tag + (z.tag ?? 0));
			nacht = rappen(nacht + (z.nacht ?? 0));
		}
		const personen = Object.keys(stunden).length;
		if (personen === 0) {
			monate.push({ monat: m.monat, status: 'leer', personen, tag, nacht });
			continue;
		}
		const bisher = await loadMonat(m.monat);
		const hatBisher = Object.values(bisher?.stunden ?? {}).some(
			(e) => (e.tag ?? 0) > 0 || (e.nacht ?? 0) > 0
		);
		if (hatBisher && !ueberschreiben) {
			monate.push({ monat: m.monat, status: 'vorhanden', personen, tag, nacht });
			continue;
		}
		// Overwrite: hours of the persons in the file replace theirs, others stay
		if (anwenden) await saveMonat(m.monat, { ...(bisher?.stunden ?? {}), ...stunden });
		monate.push({
			monat: m.monat,
			status: hatBisher ? 'ueberschrieben' : 'neu',
			personen,
			tag,
			nacht
		});
	}

	return {
		angewendet: anwenden,
		monate,
		neuePersonen,
		saetze,
		saetzeListe: plan.saetze,
		hinweise: plan.hinweise
	};
}
