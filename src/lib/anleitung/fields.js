/**
 * Field references in guide chapters: a chapter names a Prismic field by its key instead of
 * typing label and explanation —
 *
 *   <li data-field="angebot.dauer"></li>             → <li><strong>Dauer (Minuten):</strong> description</li>
 *   <li data-field="angebot.bild">extra text</li>    → … description + extra text
 *   <span data-field="ort.telefon"></span>           → <strong>Telefon</strong> (label only, inline)
 *
 * Key = "<custom type or slice>.<field API-ID>", as in src/lib/fieldDescriptions.json.
 * Label: generated Prismic model (always current). Description: only the texts written by the
 * agency (/agency/feldreferenz) — the automatic ones are too generic for a guide.
 *
 * Pure functions (no file access): used by the website (server) and the Node scripts.
 */

const escapeHtml = (/** @type {string} */ value) =>
	String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * @param {{ customType: string; field: string; label: string }[]} reference generated field reference
 * @param {Record<string, Record<string, string>>} descriptions fieldDescriptions.json
 * @returns {(key: string) => { label: string; text: string } | null}
 */
export function fieldLookup(reference, descriptions) {
	/** @type {Map<string, { label: string; text: string }>} */
	const fields = new Map();
	for (const item of reference) {
		const key = `${item.customType}.${item.field}`;
		if (!fields.has(key)) {
			fields.set(key, { label: item.label, text: descriptions[key]?.['de-ch']?.trim() ?? '' });
		}
	}
	return (key) => fields.get(key) ?? null;
}

/** Keys of all field references in a chapter @param {string} html */
export const fieldRefs = (html) => [...html.matchAll(/data-field="([^"]+)"/g)].map((m) => m[1]);

/**
 * Replaces the field references of a chapter.
 * @param {string} html
 * @param {(key: string) => { label: string; text: string } | null} lookup
 * @param {{ descriptions?: boolean }} [options] descriptions: false → labels only (chat bot
 *   knowledge base: the descriptions are already in its field reference)
 * @returns {{ html: string; unknown: string[] }} unknown: keys without a field (shown as key)
 */
export function expandFieldRefs(html, lookup, { descriptions = true } = {}) {
	/** @type {string[]} */
	const unknown = [];
	const find = (/** @type {string} */ key) => {
		const field = lookup(key);
		if (!field) unknown.push(key);
		return field ?? { label: key, text: '' };
	};
	const expanded = html
		.replace(/<li data-field="([^"]+)">([\s\S]*?)<\/li>/g, (_, key, extra) => {
			const field = find(key);
			const text = [descriptions ? escapeHtml(field.text) : '', extra.trim()]
				.filter(Boolean)
				.join(' ');
			return text
				? `<li><strong>${escapeHtml(field.label)}:</strong> ${text}</li>`
				: `<li><strong>${escapeHtml(field.label)}</strong></li>`;
		})
		.replace(
			/<span data-field="([^"]+)"><\/span>/g,
			(_, key) => `<strong>${escapeHtml(find(key).label)}</strong>`
		);
	return { html: expanded, unknown: [...new Set(unknown)] };
}
