/**
 * Scheduled function: reminder e-mails of appointment bookings
 * (setting «Erinnerung: Stunden vor Termin»). Runs hourly and calls the SvelteKit endpoint
 * /api/cron/termin-erinnerungen, which uses the shared mail texts (src/lib/server/bookingMails.ts).
 *
 * Required env vars: ADMIN_SECRET (key of the call), URL (set by Netlify).
 */
import type { Config } from '@netlify/functions';
import { createHmac } from 'crypto';

export const config: Config = {
	schedule: '10 * * * *'
};

export default async function handler() {
	const base = process.env.URL;
	const secret = process.env.ADMIN_SECRET;
	if (!base || !secret) {
		console.error('[termin-erinnerungen] URL oder ADMIN_SECRET fehlt');
		return;
	}
	// Same key as cronKey() in src/lib/server/adminAuth.ts
	const key = createHmac('sha256', `cron:${secret}`)
		.update('termin-erinnerungen')
		.digest('base64url');
	const res = await fetch(`${base}/api/cron/termin-erinnerungen`, {
		method: 'POST',
		headers: { 'x-cron-key': key }
	});
	console.log('[termin-erinnerungen]', res.status, await res.text());
}
