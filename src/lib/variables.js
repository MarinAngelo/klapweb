/**
 * Variables (Prismic document "Variablen") for website and mails.
 *
 * Per entry: Token-Name, Wert / Wert (EN) (one line), Text / Text (EN) (multi-line rich text,
 * has priority). English pages / bookings (lang en-*) use the EN fields, fallback German.
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

/** @param {string | undefined} lang */
const isEnglish = (lang) => (lang ?? '').split('-')[0] === 'en';

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
 * Values of one entry in a language: rich text has priority over the one-line value
 * @param {any} entry
 * @param {string | undefined} lang
 * @returns {{ rich: any[] | null; plain: string | null }}
 */
function pick(entry, lang) {
	const en = isEnglish(lang);
	const rich =
		en && filledRich(entry.text_en) ? entry.text_en : filledRich(entry.text) ? entry.text : null;
	const plainValue = en && entry.value_en?.trim() ? entry.value_en : entry.wert;
	return { rich, plain: plainValue ?? null };
}

/** @param {any} data @returns {any[]} */
const entries = (data) =>
	(data?.eintraege ?? []).filter((/** @type {any} */ e) => e?.schluessel?.trim());

/**
 * Website: plain map (inline use) + rich map (token alone in a paragraph → paragraphs)
 * @param {any} data  data of the Variablen document
 * @param {string} [lang]
 */
export function websiteVariables(data, lang) {
	/** @type {Record<string, string>} */
	const plain = {};
	/** @type {Record<string, any[]>} */
	const rich = {};
	for (const entry of entries(data)) {
		const key = tokenKey(entry.schluessel);
		const value = pick(entry, lang);
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
 * @param {any} data
 * @param {string} [lang]
 * @returns {Record<string, { html: string; text: string }>}
 */
export function mailVariables(data, lang) {
	/** @type {Record<string, { html: string; text: string }>} */
	const map = {};
	for (const entry of entries(data)) {
		const value = pick(entry, lang);
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
 * Loads the Variablen document (null if the type does not exist in the repository)
 * @param {import('@prismicio/client').Client} client
 */
export async function loadVariablesData(client) {
	try {
		return (await client.getSingle(/** @type {any} */ ('variablen'), { lang: '*' })).data;
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
