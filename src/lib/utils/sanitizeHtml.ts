import { browser } from '$app/environment';
import DOMPurify from 'dompurify';

/**
 * Bereinigt HTML mit DOMPurify im Browser.
 * Beim SSR wird der Inhalt unverändert zurückgegeben
 * (serverseitiger Inhalt kommt vom vertrauenswürdigen CMS).
 */
export function sanitizeHtml(html: string): string {
	if (!browser) return html;
	return DOMPurify.sanitize(html);
}
