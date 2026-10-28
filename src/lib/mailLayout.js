/**
 * Guest mails (booking confirmation, reminders) in the standard colours of the page:
 * active Prismic theme → page background/text, header bar (site name), links, titles.
 * Mail clients ignore stylesheets → everything inline.
 *
 * Plain JS without SvelteKit aliases: also imported by netlify/functions/send-reminders.ts.
 */
import * as prismic from '@prismicio/client';

/**
 * @typedef {{
 *   siteName: string;
 *   bg: string; color: string; link: string;
 *   headerBg: string; headerColor: string;
 *   font: string;
 * }} MailTheme
 */

/** Neutral fallback (no theme in the repository) */
const NEUTRAL = {
	bg: '#ffffff',
	color: '#27272a',
	headerBg: '#27272a',
	headerColor: '#ffffff'
};

/** @param {string} value */
const escapeHtml = (value) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Settings (site name, in the mail language) + active theme (colours, font)
 * @param {import('@prismicio/client').Client} client
 * @param {string} [lang]
 * @returns {Promise<MailTheme>}
 */
export async function loadMailTheme(client, lang) {
	const [settings, themes] = await Promise.all([
		client
			.getSingle(/** @type {any} */ ('settings'), lang ? { lang } : {})
			.catch(() => client.getSingle(/** @type {any} */ ('settings')).catch(() => null)),
		client.getAllByType(/** @type {any} */ ('theme'), { lang: '*' }).catch(() => [])
	]);
	/** @type {any} */
	const t = themes.find((th) => /** @type {any} */ (th.data)?.activ === true)?.data ?? {};
	/** @type {any} */
	const s = settings?.data ?? {};

	// Font name of the linked font document (web fonts load in few mail clients → fallback)
	let font = t.preset_font || '';
	if (!font && t.page_font?.id) {
		font = await client
			.getByID(t.page_font.id)
			.then((doc) => /** @type {any} */ (doc.data)?.name ?? '')
			.catch(() => '');
	}

	const color = t.page_color || NEUTRAL.color;
	return {
		siteName: s.site_name || prismic.asText(s.site_title) || '',
		bg: t.page_bg_color || NEUTRAL.bg,
		color,
		link: t.page_link_color || color,
		headerBg: t.header_bg_color || NEUTRAL.headerBg,
		headerColor: t.header_color || NEUTRAL.headerColor,
		font: `${font ? `'${font}', ` : ''}Arial, Helvetica, sans-serif`
	};
}

/**
 * Serializer for the mail body (titles, paragraphs, lists, links in theme colours)
 * @param {MailTheme | null | undefined} theme
 * @returns {import('@prismicio/client').HTMLRichTextMapSerializer}
 */
export function mailSerializer(theme) {
	const color = theme?.color ?? NEUTRAL.color;
	const link = theme?.link ?? color;
	/** @param {string} tag @param {number} size @param {string} margin */
	const heading =
		(tag, size, margin) =>
		(/** @type {{ children: string }} */ { children }) =>
			`<${tag} style="font-size:${size}px;line-height:1.3;font-weight:700;margin:${margin};color:${color};">${children}</${tag}>`;
	return {
		heading1: heading('h1', 24, '28px 0 12px'),
		heading2: heading('h2', 20, '24px 0 10px'),
		heading3: heading('h3', 17, '20px 0 8px'),
		paragraph: ({ children }) => `<p style="margin:0 0 14px;line-height:1.6;">${children}</p>`,
		list: ({ children }) => `<ul style="margin:0 0 14px;padding-left:22px;">${children}</ul>`,
		oList: ({ children }) => `<ol style="margin:0 0 14px;padding-left:22px;">${children}</ol>`,
		listItem: ({ children }) => `<li style="margin:0 0 6px;line-height:1.6;">${children}</li>`,
		oListItem: ({ children }) => `<li style="margin:0 0 6px;line-height:1.6;">${children}</li>`,
		hyperlink: ({ node, children }) => {
			const target = /** @type {any} */ (node.data)?.target === '_blank' ? ' target="_blank"' : '';
			return `<a href="${prismic.asLink(/** @type {any} */ (node.data)) ?? '#'}"${target} style="color:${link};text-decoration:underline;">${children}</a>`;
		}
	};
}

/**
 * Complete mail document: header bar with the site name, content in page colours
 * @param {string} content  body HTML
 * @param {MailTheme | null | undefined} theme
 * @param {{ lang?: string; subject?: string }} [options]
 */
export function wrapMail(content, theme, options = {}) {
	const t = theme ?? {
		siteName: '',
		...NEUTRAL,
		link: NEUTRAL.color,
		font: 'Arial, Helvetica, sans-serif'
	};
	const lang = (options.lang ?? 'de').slice(0, 2);
	return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(options.subject ?? t.siteName)}</title></head>
<body style="margin:0;padding:0;background:${t.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.bg};padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
${t.siteName ? `<tr><td style="background:${t.headerBg};color:${t.headerColor};padding:18px 28px;font-family:${t.font};font-size:20px;font-weight:700;border-radius:10px 10px 0 0;">${escapeHtml(t.siteName)}</td></tr>` : ''}
<tr><td style="background:${t.bg};color:${t.color};padding:28px;font-family:${t.font};font-size:16px;line-height:1.6;">${content}</td></tr>
</table></td></tr></table>
</body></html>`;
}
