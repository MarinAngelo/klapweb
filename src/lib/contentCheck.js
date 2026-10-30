/**
 * Content check for editors: missing translations + link problems in Prismic.
 * Used by scripts/check-translations.js (terminal, dev/build) and /admin/inhalte (editors).
 *
 * Plain JS without SvelteKit aliases so Node scripts can import it.
 */

/** Custom types rendered as their own (static) pages — keep in sync with the routes */
export const TRANSLATED_TYPES = ['page', 'leistung', 'ressource'];

/**
 * Tokens filled in by the code (mails, invoices, appointments, events, page prices).
 * Variables from the Prismic document "Variablen" are added at runtime.
 * New token in the code → add it here, otherwise "Inhalte prüfen" reports it as unknown.
 */
export const CODE_TOKENS = [
	// Resource bookings (confirmation, reminders)
	'Name',
	'Ressource',
	'RessourceUid',
	'Anreise',
	'Abreise',
	'Nächte',
	'Personen',
	'Zimmer',
	'Total',
	'Buchungsreferenz',
	'Türcode',
	'Messenger-Apps',
	'WhatsApp',
	// Page prices / e-commerce
	'Preis',
	'Rabatt',
	'PreisRabatt',
	'Anzahlung',
	'AnzahlungBetrag',
	'Restbetrag',
	'Abrechnungsart',
	'Dienstleistung',
	// Invoices, customers, newsletter
	'Betrag',
	'Einmalig',
	'Monatlich',
	'Jährlich',
	'Email',
	'Firma',
	'Kundenname',
	'Vorname',
	'Nachname',
	'Rechnungsnummer',
	'Waehrung',
	'Zahlungsfrist',
	// Appointments / events
	'Titel',
	'Datum',
	'Uhrzeit',
	'Dauer',
	'Ort',
	'Event-Name',
	'Wegbeschreibung',
	'Ort-Telefon'
];

const TOKEN = /\{\{([^{}]+)\}\}/g;

/** Token name comparable to variable names (see tokenKey in variables.js) */
const tokenName = (/** @type {string} */ name) =>
	name
		.trim()
		.replace(/^\{\{\s*/, '')
		.replace(/\s*\}\}$/, '')
		.normalize('NFC');

/** Edit distance for "did you mean" suggestions */
function distance(/** @type {string} */ a, /** @type {string} */ b) {
	const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
	for (let j = 1; j <= b.length; j++) d[0][j] = j;
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++)
			d[i][j] = Math.min(
				d[i - 1][j] + 1,
				d[i][j - 1] + 1,
				d[i - 1][j - 1] + (a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1)
			);
	return d[a.length][b.length];
}

/**
 * All strings of a document (text fields, rich text) except variable definitions
 * @param {any} node
 * @returns {Generator<string>}
 */
function* textValues(node) {
	if (typeof node === 'string') yield node;
	else if (node && typeof node === 'object') {
		for (const [key, value] of Object.entries(node)) {
			if (key === 'schluessel') continue; // Token-Name of a variable is a definition
			yield* textValues(value);
		}
	}
}

const ABSOLUTE_OR_SPECIAL = /^(https?:|mailto:|tel:|\/|#|\{\{)/i;

/**
 * @typedef {{ link_type?: string; url?: string; id?: string; type?: string; uid?: string; lang?: string }} LinkField
 * @typedef {{ id: string; type: string; uid: string | null; lang: string; title: string }} DocRef
 * @typedef {{ doc: DocRef; kind: 'relative' | 'untranslated_target' | 'unknown_token'; url?: string; target?: string; suggestion?: string; token?: string }} LinkProblem
 */

/**
 * All link fields (incl. rich text hyperlinks) of a document
 * @param {any} node
 * @returns {Generator<LinkField>}
 */
function* linkFields(node) {
	if (!node || typeof node !== 'object') return;
	if (typeof node.link_type === 'string') yield node;
	for (const value of Object.values(node)) yield* linkFields(value);
}

/**
 * Readable title of a document (title / name / label field, otherwise uid)
 * @param {any} doc
 * @returns {string}
 */
function docTitle(doc) {
	const d = doc.data ?? {};
	for (const key of ['title', 'name', 'label', 'meta_title']) {
		const v = d[key];
		if (typeof v === 'string' && v.trim()) return v.trim();
		if (Array.isArray(v) && v[0]?.text) return v[0].text;
	}
	return doc.uid ?? doc.type;
}

/** @type {(doc: any) => DocRef} */
const ref = (doc) => ({
	id: doc.id,
	type: doc.type,
	uid: doc.uid ?? null,
	lang: doc.lang,
	title: docTitle(doc)
});

/**
 * @param {import('@prismicio/client').Client} client
 * @returns {Promise<{
 *   langs: string[];
 *   master: string;
 *   missing: { doc: DocRef; lacking: string[] }[];
 *   links: LinkProblem[];
 * }>}
 */
export async function checkContent(client) {
	const repo = await client.getRepository();
	const langs = repo.languages.map((l) => l.id);
	const master = repo.languages.find((l) => l.is_master)?.id ?? langs[0];

	const docs = await client.dangerouslyGetAll({ lang: '*' });
	const byId = new Map(docs.map((d) => [d.id, d]));

	// 1. Missing translations (only with more than one language)
	/** @type {{ doc: DocRef; lacking: string[] }[]} */
	const missing = [];
	if (langs.length > 1) {
		for (const doc of docs) {
			if (!TRANSLATED_TYPES.includes(doc.type) || doc.lang !== master) continue;
			const translated = new Set([doc.lang, ...doc.alternate_languages.map((a) => a.lang)]);
			const lacking = langs.filter((l) => !translated.has(l));
			if (lacking.length) missing.push({ doc: ref(doc), lacking });
		}
	}

	// 2. Link problems in all documents and languages
	/** @type {LinkProblem[]} */
	const links = [];
	for (const doc of docs) {
		for (const link of linkFields(doc.data)) {
			if (link.link_type === 'Web' && link.url && !ABSOLUTE_OR_SPECIAL.test(link.url)) {
				links.push({ doc: ref(doc), kind: 'relative', url: link.url });
			}
			if (link.link_type === 'Document' && doc.lang !== master && link.lang === master) {
				const translation = byId
					.get(link.id ?? '')
					?.alternate_languages?.find((a) => a.lang === doc.lang);
				if (translation) {
					links.push({
						doc: ref(doc),
						kind: 'untranslated_target',
						target: `${link.type}/${link.uid} (${master})`,
						suggestion: `${translation.uid} (${doc.lang})`
					});
				}
			}
		}
	}

	// 3. Unknown tokens ({{…}} that neither the code nor a variable fills in)
	const known = new Set(CODE_TOKENS);
	for (const doc of docs) {
		if (doc.type !== 'variablen') continue;
		for (const entry of /** @type {any} */ (doc.data)?.eintraege ?? []) {
			if (entry?.schluessel?.trim()) known.add(tokenName(entry.schluessel));
		}
	}
	for (const doc of docs) {
		const reported = new Set();
		for (const text of textValues(doc.data)) {
			for (const [, raw] of text.matchAll(TOKEN)) {
				const name = tokenName(raw);
				if (known.has(name) || reported.has(name)) continue;
				reported.add(name);
				const best = [...known]
					.map((k) => ({ k, d: distance(name, k) }))
					.sort((a, b) => a.d - b.d)[0];
				links.push({
					doc: ref(doc),
					kind: 'unknown_token',
					token: `{{${raw}}}`,
					// Only close matches (typos), not unrelated short names
					suggestion: best && best.d <= 2 && best.d < name.length / 3 ? `{{${best.k}}}` : undefined
				});
			}
		}
	}

	return { langs, master, missing, links };
}
