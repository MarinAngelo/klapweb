/**
 * Splits plain text into text and link parts (no HTML → safe to render without {@html}).
 * Detects e-mail addresses (mailto:), URLs with http(s):// and bare domains such as
 * «klap-web.ch/kontakt» or «www.example.com». Trailing punctuation is not part of the link.
 */
export type TextPart = { text: string; href?: string; external?: boolean };

const PATTERN =
	/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})|(https?:\/\/[^\s<>«»"]+)|((?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:ch|li|de|at|com|org|net|io|swiss|eu|info)(?:\/[^\s<>«»"]*)?)/gi;
const TRAILING = /[.,;:!?)\]»"']+$/;

export function linkify(text: string, currentHost = ''): TextPart[] {
	const parts: TextPart[] = [];
	let last = 0;
	for (const match of text.matchAll(PATTERN)) {
		let value = match[0];
		const trailing = value.match(TRAILING)?.[0] ?? '';
		value = value.slice(0, value.length - trailing.length);
		const start = match.index ?? 0;
		// Part of an e-mail address or a longer word (e.g. «file.ch» inside «my-file.ch.txt»)
		if (!value || (start > 0 && /[\w@/.-]/.test(text[start - 1]))) continue;

		if (start > last) parts.push({ text: text.slice(last, start) });
		if (match[1]) {
			parts.push({ text: value, href: `mailto:${value}` });
		} else {
			const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
			let host = '';
			try {
				host = new URL(href).hostname.replace(/^www\./, '');
			} catch {
				// invalid → still shown as link text
			}
			parts.push({ text: value, href, external: host !== currentHost.replace(/^www\./, '') });
		}
		last = start + value.length;
	}
	if (last < text.length) parts.push({ text: text.slice(last) });
	return parts;
}
