import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isValidCronKey } from '$lib/server/adminAuth';
import { sendDueBookingReminders } from '$lib/server/bookingReminders';
import { FEATURE_TERMINBUCHUNG } from '$lib/server/features';

// Called hourly by netlify/functions/termin-erinnerungen.ts (key = HMAC of ADMIN_SECRET)
export const POST: RequestHandler = async ({ request, url }) => {
	if (!isValidCronKey('termin-erinnerungen', request.headers.get('x-cron-key'))) {
		return json({ error: 'forbidden' }, { status: 403 });
	}
	if (!FEATURE_TERMINBUCHUNG || !env.NETLIFY_SITE_ID || !env.NETLIFY_TOKEN) {
		return json({ skipped: true });
	}
	const sent = await sendDueBookingReminders(url.origin);
	return json({ sent });
};
