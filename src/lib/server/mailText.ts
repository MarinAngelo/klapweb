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
