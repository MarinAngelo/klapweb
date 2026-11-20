import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isValidCronKey } from '$lib/server/adminAuth';
import { sendDueReminders } from '$lib/server/dunning';

// Called daily by netlify/functions/mahnungen.ts (key = HMAC of ADMIN_SECRET)
export const POST: RequestHandler = async ({ request }) => {
	if (!isValidCronKey('mahnungen', request.headers.get('x-cron-key'))) {
		return json({ error: 'forbidden' }, { status: 403 });
	}
	if (!env.NETLIFY_SITE_ID || !env.NETLIFY_TOKEN) return json({ skipped: true });
	const reminded = await sendDueReminders();
	return json({ reminded });
};
