import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isValidCronKey } from '$lib/server/adminAuth';
import { sendDueBookingInvoices } from '$lib/server/bookingInvoices';
import { FEATURE_TERMINBUCHUNG } from '$lib/server/features';

// Called hourly by netlify/functions/termin-rechnungen.ts (key = HMAC of ADMIN_SECRET)
export const POST: RequestHandler = async ({ request }) => {
	if (!isValidCronKey('termin-rechnungen', request.headers.get('x-cron-key'))) {
		return json({ error: 'forbidden' }, { status: 403 });
	}
	if (!FEATURE_TERMINBUCHUNG || !env.NETLIFY_SITE_ID || !env.NETLIFY_TOKEN) {
		return json({ skipped: true });
	}
	const created = await sendDueBookingInvoices();
	return json({ created });
};
