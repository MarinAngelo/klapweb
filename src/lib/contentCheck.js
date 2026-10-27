/**
 * Content check for editors: missing translations + link problems in Prismic.
 * Used by scripts/check-translations.js (terminal, dev/build) and /admin/inhalte (editors).
 *
 * Plain JS without SvelteKit aliases so Node scripts can import it.
 */

/** Custom types rendered as their own (static) pages — keep in sync with the routes */
export const TRANSLATED_TYPES = ['page', 'leistung', 'ressource'];

const ABSOLUTE_OR_SPECIAL = /^(https?:|mailto:|tel:|\/|#|\{\{)/i;

/**
 * @typedef {{ link_type?: string; url?: string; id?: string; type?: string; uid?: string; lang?: string }} LinkField
 * @typedef {{ id: string; type: string; uid: string | null; lang: string; title: string }} DocRef
 * @typedef {{ doc: DocRef; kind: 'relative' | 'untranslated_target'; url?: string; target?: string; suggestion?: string }} LinkProblem
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

	return { langs, master, missing, links };
}
