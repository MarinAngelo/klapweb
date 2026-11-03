/**
 * Sender address of all e-mails: Prismic Settings → «Absender-E-Mail» (`email_from_address`,
 * main language). The domain must be verified in Resend.
 *
 * Transition: while the field is empty, the old env var EMAIL_FROM_ADDRESS is used (warning in
 * the log, «Inhalte prüfen» reports the empty field). Remove the fallback once all sites have
 * the field filled.
 */
import { env } from '$env/dynamic/private';
import { createClient } from '$lib/prismicio';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CACHE_MS = 5 * 60 * 1000;
let cache: { value: string; at: number } | null = null;
let warned = false;

/** Sender address from settings data (main language); '' if missing or invalid */
export function mailFromSettings(data: unknown): string {
	const value = String(
		(data as { email_from_address?: string } | null)?.email_from_address ?? ''
	).trim();
	return EMAIL.test(value) ? value : '';
}

function withFallback(value: string): string {
	if (value) return value;
	const legacy = (env.EMAIL_FROM_ADDRESS ?? '').trim();
	if (legacy && !warned) {
		warned = true;
		console.warn(
			'[mail] Einstellungen → «Absender-E-Mail» ist leer — vorläufig wird EMAIL_FROM_ADDRESS verwendet. Bitte das Feld in Prismic ausfüllen.'
		);
	}
	return legacy;
}

/**
 * Sender address for e-mails ('' = not configured → do not send).
 * Cached per server instance for 5 minutes.
 */
export async function getMailFrom(fetchFn?: typeof fetch): Promise<string> {
	if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
	let value = '';
	try {
		// Without `lang` Prismic returns the main language
		const settings = await createClient(fetchFn ? { fetch: fetchFn } : {}).getSingle('settings');
		value = mailFromSettings(settings.data);
	} catch (e) {
		console.error('[mail] Einstellungen konnten nicht geladen werden:', e);
	}
	value = withFallback(value);
	cache = { value, at: Date.now() };
	return value;
}
