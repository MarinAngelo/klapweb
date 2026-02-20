/**
 * Einfache HTML-Sanitierung für CMS-Inhalte.
 * Entfernt Script-Tags, Event-Handler und javascript:-URLs.
 * Für vollständige Sanitierung wäre DOMPurify empfohlen.
 */
export function sanitizeHtml(html: string): string {
	return html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
		.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
		.replace(/javascript\s*:/gi, '');
}
