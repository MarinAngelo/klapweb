import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isValidCronKey } from '$lib/server/adminAuth';
import { sendDueRecurringInvoices } from '$lib/server/recurringInvoices';

// Called daily by netlify/functions/wiederkehrende-rechnungen.ts (key = HMAC of ADMIN_SECRET)
export const POST: RequestHandler = async ({ request }) => {
	if (!isValidCronKey('wiederkehrende-rechnungen', request.headers.get('x-cron-key'))) {
		return json({ error: 'forbidden' }, { status: 403 });
	}
	if (!env.NETLIFY_SITE_ID || !env.NETLIFY_TOKEN) return json({ skipped: true });
	const created = await sendDueRecurringInvoices();
	return json({ created });
};
