/**
 * Chat-Bot Wissensbasis (docs/chatbot-wissensbasis.html): updates the two automatic sections
 *
 *   <!-- AUTO:ANLEITUNGEN:START --> … <!-- AUTO:ANLEITUNGEN:END -->
 *     the guide chapters from src/lib/anleitung/ (same source as the website /anleitung) —
 *     edit the chapters there, never between the markers; parts marked NUR-WEBSITE are left out.
 *     Plus the own parts of the «Anleitung» elements on the Prismic page `anleitung`
 *     (klap-web-ch, published): title, description, steps — placed before the text of the chosen
 *     chapter, like on the website. Prismic not reachable → the guide section stays as it was.
 *
 *   <!-- AUTO:FELDREFERENZ:START --> … <!-- AUTO:FELDREFERENZ:END -->
 *     «Prismic-Feldreferenz» from the generated field reference
 *     (src/lib/generated/prismic-field-reference.json, active plan → run on klap-web-ch for all
 *     features) and the agency descriptions (src/lib/fieldDescriptions.json, /agency/feldreferenz)
 *
 * Everything outside the markers (about KLAP WEB, prices, FAQ) is written by hand.
 *
 * npm run wissensbasis   (the Claude task /chatbot-wissensbasis also updates the chapters)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readChapterHtml, readChapterIndex } from '../src/lib/anleitung/load.js';
import { expandFieldRefs, fieldLookup } from '../src/lib/anleitung/fields.js';
import { ALL_CHAPTERS } from '../src/lib/anleitung/options.js';
import { asHTML, asText } from '@prismicio/client';

const KB = 'docs/chatbot-wissensbasis.html';
const REFERENCE = 'src/lib/generated/prismic-field-reference.json';
const DESCRIPTIONS = 'src/lib/fieldDescriptions.json';
const START = '<!-- AUTO:FELDREFERENZ:START -->';
const END = '<!-- AUTO:FELDREFERENZ:END -->';
const GUIDES_START = '<!-- AUTO:ANLEITUNGEN:START -->';
const GUIDES_END = '<!-- AUTO:ANLEITUNGEN:END -->';

const escapeHtml = (value) =>
	String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Readable field types for editors */
const TYPE_LABEL = {
	Text: 'Text',
	'Key Text': 'Text',
	StructuredText: 'formatierter Text',
	Image: 'Bild',
	Boolean: 'Ein/Aus',
	Number: 'Zahl',
	Select: 'Auswahl',
	Color: 'Farbe',
	Date: 'Datum',
	Timestamp: 'Datum und Zeit',
	Link: 'Link',
	ContentRelationship: 'Verknüpfung',
	Embed: 'Einbettung',
	Group: 'Liste',
	GeoPoint: 'Ort',
	UID: 'UID'
};

if (!existsSync(REFERENCE)) {
	console.error(
		`✗ ${REFERENCE} fehlt — zuerst «npm run dev» bzw. «node scripts/build-customtypes.js»`
	);
	process.exit(1);
}
const reference = JSON.parse(readFileSync(REFERENCE, 'utf8'));
const descriptions = existsSync(DESCRIPTIONS) ? JSON.parse(readFileSync(DESCRIPTIONS, 'utf8')) : {};

// One entry per field (slice fields are shared by their variations)
const groups = new Map();
for (const item of reference) {
	if (item.type === 'Slices' || item.field === 'uid') continue;
	const key = `${item.customType}.${item.field}`;
	const group = groups.get(item.customType) ?? {
		name: item.customTypeLabel || item.name,
		kind: item.elementType === 'Slice' ? 'Inhalts-Element' : 'Inhalts-Typ',
		fields: new Map()
	};
	if (!group.fields.has(key)) {
		const agency = descriptions[key]?.['de-ch']?.trim();
		// Automatic texts are generic — only keep the options of a selection
		const options = item.type === 'Select' ? item.description.split(': ').slice(1).join(': ') : '';
		group.fields.set(key, {
			label: item.label,
			type: TYPE_LABEL[item.type] ?? item.type,
			text: agency || (options ? `Optionen: ${options.replace(/\.$/, '')}` : '')
		});
	}
	groups.set(item.customType, group);
}

const sorted = [...groups.values()].sort(
	(a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)
);
const html = [
	START,
	'<h2>Prismic-Feldreferenz (alle Felder)</h2>',
	'<p>Alle Felder der Inhalts-Typen und Inhalts-Elemente in Prismic, mit Feldtyp und Erklärung. Die vollständige Referenz steht auf der Website unter /prismic-feldreferenz (im Admin-Bereich unter «Hilfe»).</p>',
	...sorted.map((group) =>
		[
			`<h3>${escapeHtml(group.name)} (${group.kind})</h3>`,
			'<ul>',
			...[...group.fields.values()].map(
				(f) =>
					`\t<li>${escapeHtml(f.label)} (${escapeHtml(f.type)})${f.text ? `: ${escapeHtml(f.text)}` : ''}</li>`
			),
			'</ul>'
		].join('\n')
	),
	END
].join('\n');

// Guide chapters (src/lib/anleitung)
// Parts between <!-- NUR-WEBSITE:START --> and <!-- NUR-WEBSITE:END --> (checklists, best
// practices, summaries) are for readers of the website only — they would just make every
// chat request longer
// Field references (data-field): labels only — the descriptions are in the field reference below
const lookup = fieldLookup(reference, descriptions);
const unknownFields = new Set();
const forBot = (source) => {
	const { html, unknown } = expandFieldRefs(source, lookup, { descriptions: false });
	for (const key of unknown) unknownFields.add(key);
	return html
		.replace(/<!-- NUR-WEBSITE:START -->[\s\S]*?<!-- NUR-WEBSITE:END -->\n?/g, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
};
// Own parts of the «Anleitung» elements on the Prismic page (edited by KLAP WEB in Prismic)
const GUIDE_PAGE = { repo: 'klap-web-ch', uid: 'anleitung', lang: 'de-ch' };

/** «Anleitung» slice → HTML of its own parts (without the chapter text from the code) */
function ownPartHtml(primary) {
	const parts = [];
	if (primary.title) parts.push(`<h3>${escapeHtml(primary.title)}</h3>`);
	if (asText(primary.description ?? []).trim()) parts.push(asHTML(primary.description));
	for (const step of primary.steps ?? []) {
		if (step.step_title) parts.push(`<h4>${escapeHtml(step.step_title)}</h4>`);
		if (asText(step.step_description ?? []).trim()) parts.push(asHTML(step.step_description));
	}
	if (parts.length && primary.chapter_title)
		parts.push(`<h3>${escapeHtml(primary.chapter_title)}</h3>`);
	return parts.join('\n');
}

/** Map chapter title → own HTML; null if Prismic could not be read */
async function loadOwnParts() {
	try {
		const base = `https://${GUIDE_PAGE.repo}.cdn.prismic.io/api/v2`;
		const api = await (await fetch(base, { signal: AbortSignal.timeout(15000) })).json();
		const ref = api.refs.find((r) => r.isMasterRef).ref;
		const query = encodeURIComponent(`[[at(my.page.uid,"${GUIDE_PAGE.uid}")]]`);
		const { results } = await (
			await fetch(`${base}/documents/search?ref=${ref}&lang=${GUIDE_PAGE.lang}&q=${query}`, {
				signal: AbortSignal.timeout(15000)
			})
		).json();
		const byChapter = new Map();
		for (const slice of results?.[0]?.data?.slices ?? []) {
			if (slice.slice_type !== 'anleitung') continue;
			const html = ownPartHtml(slice.primary ?? {});
			if (!html) continue;
			const chapter = slice.primary.chapter || ALL_CHAPTERS;
			byChapter.set(chapter, [byChapter.get(chapter), html].filter(Boolean).join('\n'));
		}
		return byChapter;
	} catch (e) {
		console.warn(
			`⚠ Prismic-Seite «${GUIDE_PAGE.uid}» nicht erreichbar (${e.message}) — Anleitungs-Teil bleibt unverändert`
		);
		return null;
	}
}

const chapters = readChapterIndex();
const ownParts = await loadOwnParts();
const guidesHtml =
	ownParts &&
	[
		GUIDES_START,
		...chapters.map(
			(c) =>
				`<h2>${escapeHtml(c.title)}</h2>\n${[ownParts.get(c.title), forBot(readChapterHtml(c.id) ?? '')].filter(Boolean).join('\n')}\n`
		),
		// «Alle übrigen Kapitel» or a chapter that no longer exists: own section
		...[...ownParts]
			.filter(([title]) => !chapters.some((c) => c.title === title))
			.map(
				([title, html]) =>
					`<h2>${escapeHtml(title === ALL_CHAPTERS ? 'Anleitung' : title)}</h2>\n${html}\n`
			),
		GUIDES_END
	].join('\n');

if (unknownFields.size) {
	console.warn(
		`⚠ Anleitung: unbekannte Felder (auf klap-web-ch ausführen, dort sind alle Funktionen aktiv): ${[...unknownFields].join(', ')}`
	);
}

let kb = readFileSync(KB, 'utf8');
if (!guidesHtml) {
	// Prismic not reachable: keep the current guide section
} else if (kb.includes(GUIDES_START) && kb.includes(GUIDES_END)) {
	kb =
		kb.slice(0, kb.indexOf(GUIDES_START)) +
		guidesHtml +
		kb.slice(kb.indexOf(GUIDES_END) + GUIDES_END.length);
} else {
	console.error(`✗ ${KB}: Markierungen ${GUIDES_START} … ${GUIDES_END} fehlen`);
	process.exit(1);
}
if (kb.includes(START) && kb.includes(END)) {
	kb = kb.slice(0, kb.indexOf(START)) + html + kb.slice(kb.indexOf(END) + END.length);
} else {
	// First run: before «Häufige Fragen» (or at the end of the body)
	const anchor = kb.includes('<h2>Häufige Fragen</h2>') ? '<h2>Häufige Fragen</h2>' : '</body>';
	kb = kb.replace(anchor, `${html}\n\n${anchor}`);
}
writeFileSync(KB, kb);

const fields = sorted.reduce((n, g) => n + g.fields.size, 0);
const described = sorted.reduce(
	(n, g) =>
		n + [...g.fields.values()].filter((f) => f.text && !f.text.startsWith('Optionen')).length,
	0
);
const words = kb
	.replace(/<[^>]+>/g, ' ')
	.split(/\s+/)
	.filter(Boolean).length;
console.log(
	`✓ ${KB}: ${chapters.length} Anleitungs-Kapitel, Feldreferenz mit ${groups.size} Elementen, ${fields} Feldern (${described} mit Agentur-Beschreibung) — Wissensbasis gesamt ca. ${words} Wörter`
);
