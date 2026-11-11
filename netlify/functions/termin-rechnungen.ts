/**
 * Scheduled function: invoices of appointment bookings after the appointment
 * (setting «Rechnung nach dem Termin senden»). Runs hourly and calls the SvelteKit endpoint
 * /api/cron/termin-rechnungen, which uses the shared invoice module (src/lib/server/invoicing).
 *
 * Required env vars: ADMIN_SECRET (key of the call), URL (set by Netlify).
 */
import type { Config } from '@netlify/functions';
import { createHmac } from 'crypto';

export const config: Config = {
	schedule: '20 * * * *'
};

export default async function handler() {
	const base = process.env.URL;
	const secret = process.env.ADMIN_SECRET;
	if (!base || !secret) {
		console.error('[termin-rechnungen] URL oder ADMIN_SECRET fehlt');
		return;
	}
	// Same key as cronKey() in src/lib/server/adminAuth.ts
	const key = createHmac('sha256', `cron:${secret}`)
		.update('termin-rechnungen')
		.digest('base64url');
	const res = await fetch(`${base}/api/cron/termin-rechnungen`, {
		method: 'POST',
		headers: { 'x-cron-key': key }
	});
	console.log('[termin-rechnungen]', res.status, await res.text());
}
