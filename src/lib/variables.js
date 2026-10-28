/**
 * Variables (Prismic document "Variablen") for website and mails.
 *
 * Per entry: Token-Name, Wert (one line), Text (multi-line rich text, has priority).
 * Languages via Prismic translations of the document: the page / booking language is used,
 * entries missing (or empty) there fall back to the main language document.
 *
 * Mails: variables are replaced first, then the booking tokens → a variable text may contain
 * {{Name}}, {{Anreise}} … A token alone in a paragraph is replaced by the whole multi-line text.
 *
 * Plain JS without SvelteKit aliases: also imported by netlify/functions/send-reminders.ts.
 */
import * as prismic from '@prismicio/client';

const TOKEN = /\{\{([^{}]+)\}\}/g;

/**
 * Comparable token name: without surrounding braces (editors sometimes enter "{{Name}}" as
 * Token-Name), trimmed, Unicode NFC (ü typed as one character or as u + combining diaeresis)
 * @param {string} name
 */
export const tokenKey = (name) =>
	name
		.trim()
		.replace(/^\{\{\s*/, '')
		.replace(/\s*\}\}$/, '')
		.normalize('NFC');

// Rich text fields come from untyped document data
/** @type {(field: any, separator?: string) => string} */
const richText = (field, separator = ' ') => prismic.asText(field, { separator }) ?? '';
/** @type {(field: any) => string} */
const richHtml = (field) => prismic.asHTML(field) ?? '';

/** @param {any} field */
const filledRich = (field) => Array.isArray(field) && richText(field).trim() !== '';

/** @param {string} value */
const escapeHtml = (value) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Values of one entry: rich text has priority over the one-line value
 * @param {any} entry
 * @returns {{ rich: any[] | null; plain: string | null }}
 */
function pick(entry) {
	return { rich: filledRich(entry.text) ? entry.text : null, plain: entry.wert ?? null };
}

/** @param {any} entry */
const hasValue = (entry) => filledRich(entry.text) || !!entry.wert?.trim();

/**
 * @typedef {{ mainLang: string; byLang: Record<string, any> }} VariablesData
 *   all language versions of the Variablen document (data per language)
 */

/**
 * Entries in a language: main language entries, overridden by the translation where it has a
 * value (missing / empty entries in the translation → main language)
 * @param {VariablesData | null | undefined} all
 * @param {string | undefined} lang
 * @returns {any[]}
 */
function entries(all, lang) {
	/** @type {(data: any) => any[]} */
	const list = (data) =>
		(data?.eintraege ?? []).filter((/** @type {any} */ e) => e?.schluessel?.trim());
	const merged = new Map();
	for (const entry of list(all?.byLang[all.mainLang]))
		merged.set(tokenKey(entry.schluessel), entry);
	if (lang && all && lang !== all.mainLang) {
		for (const entry of list(all.byLang[lang])) {
			if (hasValue(entry)) merged.set(tokenKey(entry.schluessel), entry);
		}
	}
	return [...merged.values()];
}

/**
 * Website: plain map (inline use) + rich map (token alone in a paragraph → paragraphs)
 * @param {VariablesData | null | undefined} data  see loadVariablesData
 * @param {string} [lang]
 */
export function websiteVariables(data, lang) {
	/** @type {Record<string, string>} */
	const plain = {};
	/** @type {Record<string, any[]>} */
	const rich = {};
	for (const entry of entries(data, lang)) {
		const key = tokenKey(entry.schluessel);
		const value = pick(entry);
		if (value.rich) {
			rich[key] = value.rich;
			plain[key] = richText(value.rich);
		} else if (value.plain != null) {
			plain[key] = value.plain;
		}
	}
	return { plain, rich };
}

/**
 * Mails: key → { html, text } in the booking language
 * @param {VariablesData | null | undefined} data  see loadVariablesData
 * @param {string} [lang]
 * @returns {Record<string, { html: string; text: string }>}
 */
export function mailVariables(data, lang) {
	/** @type {Record<string, { html: string; text: string }>} */
	const map = {};
	for (const entry of entries(data, lang)) {
		const value = pick(entry);
		if (value.rich) {
			map[tokenKey(entry.schluessel)] = {
				html: richHtml(value.rich),
				text: richText(value.rich, '\n\n')
			};
		} else if (value.plain != null) {
			map[tokenKey(entry.schluessel)] = { html: escapeHtml(value.plain), text: value.plain };
		}
	}
	return map;
}

/**
 * Loads all language versions of the Variablen document in one request
 * (null if the type does not exist in the repository)
 * @param {import('@prismicio/client').Client} client
 * @param {string} [mainLang]  main language (otherwise read from the repository)
 * @returns {Promise<VariablesData | null>}
 */
export async function loadVariablesData(client, mainLang) {
	try {
		const [docs, master] = await Promise.all([
			client.getAllByType(/** @type {any} */ ('variablen'), { lang: '*' }),
			mainLang
				? Promise.resolve(mainLang)
				: client
						.getRepository()
						.then((r) => r.languages.find((l) => l.is_master)?.id ?? r.languages[0]?.id ?? '')
		]);
		if (!docs.length) return null;
		/** @type {Record<string, any>} */
		const byLang = {};
		for (const doc of docs) byLang[doc.lang] = doc.data;
		return { mainLang: byLang[master] ? master : docs[0].lang, byLang };
	} catch {
		return null;
	}
}

/**
 * Mail body: variables (incl. multi-line) first, then booking tokens; unknown tokens → ''
 * @param {string} html  serialized rich text of the mail template
 * @param {Record<string, string>} tokens  booking tokens (already HTML)
 * @param {Record<string, { html: string; text: string }>} vars
 */
export function renderMailHtml(html, tokens, vars) {
	const withVars = html
		// Token alone in a paragraph → whole multi-line text (no <p> inside <p>)
		.replace(/<p>\s*\{\{([^{}]+)\}\}\s*<\/p>/g, (match, key) => vars[tokenKey(key)]?.html ?? match)
		// Inline: single paragraph without its <p> wrapper
		.replace(TOKEN, (match, key) => {
			const v = vars[tokenKey(key)];
			if (!v) return match;
			const single = v.html.match(/^<p>([\s\S]*)<\/p>$/);
			return single && !single[1].includes('<p>') ? single[1] : v.html;
		});
	return withVars.replace(TOKEN, (_, key) => tokens[tokenKey(key)] ?? '');
}

/**
 * Mail subject / plain text: variables (as text) first, then booking tokens
 * @param {string} text
 * @param {Record<string, string>} tokens
 * @param {Record<string, { html: string; text: string }>} vars
 */
export function renderMailText(text, tokens, vars) {
	return text
		.replace(TOKEN, (match, key) => vars[tokenKey(key)]?.text ?? match)
		.replace(TOKEN, (match, key) => tokens[tokenKey(key)] ?? match);
}
