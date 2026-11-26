/**
 * Shared helpers of the e-mail texts:
 * - plainTextMail(): plain text → { text, html } (see below)
 * - Mail / PreviewMail, applyTokens, richTextToMail: builders ($lib/server/*Mails.ts) and the
 *   previews in the admin (component MailPreview.svelte)
 */

/**
 * Plain text mail → { text, html }: the HTML part keeps the layout (monospace, line breaks)
 * and turns URLs into clickable links (mail clients do not reliably auto-link, e.g. localhost).
 */
function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function plainTextMail(text: string): { text: string; html: string } {
	const linked = escapeHtml(text).replace(
		/https?:\/\/[^\s<]+/g,
		(href) => `<a href="${href}">${href}</a>`
	);
	return {
		text,
		html: `<pre style="font-family:Menlo,Consolas,monospace;font-size:13px;white-space:pre-wrap;">${linked}</pre>`
	};
}

export type Mail = { subject: string; text: string; html?: string };

/** One e-mail in an admin preview (/admin/<bereich>/e-mails) */
export type PreviewMail = Mail & {
	id: string;
	/** i18n keys */
	label: string;
	when: string;
	to: string;
	attachment?: string;
	/** Sent with the current settings (otherwise marked) */
	active: boolean;
};

/** Neutral example customer (never real data in a preview) */
export const SAMPLE_CUSTOMER = {
	vorname: 'Anna',
	nachname: 'Muster',
	name: 'Anna Muster',
	email: 'anna.muster@example.com'
};

/** Replaces {{Token}} placeholders; unknown tokens stay */
export function applyTokens(str: string, tokens: Record<string, string>): string {
	return str.replace(/\{\{([^{}]+)\}\}/g, (match, k) => tokens[k.trim()] ?? match);
}

/** Prismic rich text → plain text with {{tokens}} replaced */
export function richTextToMail(
	blocks: Array<{ text?: string }> | null | undefined,
	tokens: Record<string, string>
): string {
	if (!blocks?.length) return '';
	return blocks
		.filter((b) => b.text)
		.map((b) => applyTokens(b.text!, tokens))
		.join('\n\n');
}
