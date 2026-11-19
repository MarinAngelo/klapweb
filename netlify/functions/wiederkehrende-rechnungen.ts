/**
 * Scheduled function: recurring invoices («Jährlich wiederholen» in /admin/rechnungen).
 * Runs daily and calls the SvelteKit endpoint /api/cron/wiederkehrende-rechnungen, which uses
 * src/lib/server/recurringInvoices.ts (shared invoice module).
 *
 * Required env vars: ADMIN_SECRET (key of the call), URL (set by Netlify).
 */
import type { Config } from '@netlify/functions';
import { createHmac } from 'crypto';

export const config: Config = {
	// 06:10 UTC = morning in Switzerland
	schedule: '10 6 * * *'
};

export default async function handler() {
	const base = process.env.URL;
	const secret = process.env.ADMIN_SECRET;
	if (!base || !secret) {
		console.error('[wiederkehrende-rechnungen] URL oder ADMIN_SECRET fehlt');
		return;
	}
	// Same key as cronKey() in src/lib/server/adminAuth.ts
	const key = createHmac('sha256', `cron:${secret}`)
		.update('wiederkehrende-rechnungen')
		.digest('base64url');
	const res = await fetch(`${base}/api/cron/wiederkehrende-rechnungen`, {
		method: 'POST',
		headers: { 'x-cron-key': key }
	});
	console.log('[wiederkehrende-rechnungen]', res.status, await res.text());
}
