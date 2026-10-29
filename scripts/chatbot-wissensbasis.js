/**
 * Chat-Bot Wissensbasis (docs/chatbot-wissensbasis.html): updates the automatic section
 * «Prismic-Feldreferenz» between the markers
 *   <!-- AUTO:FELDREFERENZ:START --> … <!-- AUTO:FELDREFERENZ:END -->
 * from the generated field reference (src/lib/generated/prismic-field-reference.json, active
 * plan → run on klap-web-ch for all features) and the agency descriptions
 * (src/lib/fieldDescriptions.json, /agency/feldreferenz). The written guides stay untouched.
 *
 * npm run wissensbasis   (the Claude task /chatbot-wissensbasis also updates the guides)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const KB = 'docs/chatbot-wissensbasis.html';
const REFERENCE = 'src/lib/generated/prismic-field-reference.json';
const DESCRIPTIONS = 'src/lib/fieldDescriptions.json';
const START = '<!-- AUTO:FELDREFERENZ:START -->';
const END = '<!-- AUTO:FELDREFERENZ:END -->';

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
		kind: item.elementType === 'Slice' ? 'Inhalts-Element' : 'Inhaltstyp',
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
	'<p>Alle Felder der Inhaltstypen und Inhalts-Elemente in Prismic, mit Feldtyp und Erklärung. Die vollständige Referenz steht auf der Website unter /prismic-feldreferenz (im Admin-Bereich unter «Hilfe»).</p>',
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

let kb = readFileSync(KB, 'utf8');
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
	`✓ ${KB}: Feldreferenz mit ${groups.size} Elementen, ${fields} Feldern (${described} mit Agentur-Beschreibung) — Wissensbasis gesamt ca. ${words} Wörter`
);
