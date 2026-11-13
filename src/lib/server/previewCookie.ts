/**
 * Invalid or expired Prismic preview token (cookie io.prismic.preview) → delete it.
 * Otherwise every Prismic query of the request uses that token, Prismic rejects it and the whole
 * website ends on the error page (not even the «Vorschau aktiv» notice can show).
 * Checked once per token (cached); network errors keep the cookie (no false positives).
 */
import type { Cookies } from '@sveltejs/kit';
import * as prismic from '@prismicio/client';
import { repositoryName } from '$lib/prismicio';

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 100;
const checked = new Map<string, { valid: boolean; at: number }>();

async function isValidPreviewToken(token: string, fetchFn: typeof fetch): Promise<boolean> {
	const hit = checked.get(token);
	if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.valid;
	let valid = true;
	try {
		await prismic.createClient(repositoryName, { fetch: fetchFn }).get({ ref: token, pageSize: 1 });
	} catch (error) {
		// Prismic rejected the token (invalid, expired); anything else (network) → keep it
		if (error instanceof prismic.PrismicError) valid = false;
		else return true;
	}
	if (checked.size >= CACHE_MAX) checked.delete(checked.keys().next().value!);
	checked.set(token, { valid, at: Date.now() });
	return valid;
}

export async function dropInvalidPreviewCookie(cookies: Cookies, fetchFn: typeof fetch) {
	const token = cookies.get(prismic.cookie.preview);
	if (!token) return;
	if (!(await isValidPreviewToken(token, fetchFn))) {
		cookies.delete(prismic.cookie.preview, { path: '/' });
	}
}
