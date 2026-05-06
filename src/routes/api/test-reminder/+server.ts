/**
 * GET /api/test-reminder?secret=XXX&date=YYYY-MM-DD&dryRun=true
 *
 * Runs the same logic as the send-reminders Netlify function.
 *
 * Parameters:
 *   secret  – must match ADMIN_SECRET env var
 *   date    – target arrival date (default: today + 2 days)
 *   dryRun  – if "true", shows what would be sent without actually sending (default: false)
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getStore } from '@netlify/blobs';
import * as prismic from '@prismicio/client';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import type { RequestHandler } from './$types';

function formatDate(dateStr: string): string {
	const [y, m, d] = dateStr.split('-');
	return `${d}.${m}.${y}`;
}

function replaceTokens(html: string, tokens: Record<string, string>): string {
	return html.replace(/\{\{([^}]+)\}\}/g, (_, key) => tokens[key] ?? '');
}

export const GET: RequestHandler = async ({ url }) => {
	if (url.searchParams.get('secret') !== env.ADMIN_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	const resendKey = env.RESEND_API_KEY;
	const fromEmail = env.INVOICE_FROM_EMAIL;
	const smConfig = JSON.parse(readFileSync('slicemachine.config.json', 'utf-8'));
	const repoName = env.PRISMIC_REPOSITORY_NAME || smConfig.repositoryName;
	const dryRun = url.searchParams.get('dryRun') === 'true';

	if (!siteID || !token || !resendKey || !fromEmail || !repoName) {
		return json({
			error: 'Fehlende Env-Variablen',
			siteID: !!siteID,
			token: !!token,
			resendKey: !!resendKey,
			fromEmail: !!fromEmail,
			repoName: !!repoName
		}, { status: 500 });
	}

	const targetDateStr = url.searchParams.get('date') ?? (() => {
		const d = new Date();
		d.setUTCDate(d.getUTCDate() + 2);
		return d.toISOString().slice(0, 10);
	})();

	const store = getStore({ name: 'ressource_buchungen', siteID, token });
	const { blobs } = await store.list();
	const allBookings = (await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }))
	)).filter(Boolean) as any[];

	const upcoming = allBookings.filter(
		(b) => b.von === targetDateStr && b.email && !b.reminderSent
	);

	const results: any[] = [];

	if (upcoming.length === 0) {
		return json({ targetDate: targetDateStr, message: 'Keine Ankünfte gefunden', dryRun });
	}

	const client = prismic.createClient(repoName);
	const resend = dryRun ? null : new Resend(resendKey);

	for (const buchung of upcoming) {
		try {
			const doc = await client.getByUID('ressource', buchung.ressourceUid);
			const d = doc.data as any;

			const reminderField = d.reminder_text as any[] | undefined;
			if (!reminderField?.length) {
				results.push({ id: buchung.id, status: 'skip', reason: 'Kein reminder_text' });
				continue;
			}

			const betreff = (d.reminder_betreff as string)?.trim()
				|| `Ihre Anreise morgen: ${d.name ?? buchung.ressourceUid}`;

			let html = prismic.asHTML(reminderField) ?? '';

			const uidKey = buchung.ressourceUid.toUpperCase().replace(/-/g, '_');
			const doorCode = env[`DOOR_CODE_${uidKey}`] || env.DOOR_CODE || '';

			html = replaceTokens(html, {
				Türcode: doorCode,
				Name: buchung.name || '',
				Anreise: formatDate(buchung.von),
				Abreise: formatDate(buchung.bis)
			});

			if (dryRun) {
				results.push({ id: buchung.id, status: 'dryRun', to: buchung.email, subject: betreff, html });
				continue;
			}

			const { error } = await resend!.emails.send({
				from: fromEmail,
				to: buchung.email,
				subject: betreff,
				html
			});

			if (error) {
				results.push({ id: buchung.id, status: 'error', to: buchung.email, error });
				continue;
			}

			await store.setJSON(buchung.id, { ...buchung, reminderSent: true });
			results.push({ id: buchung.id, status: 'sent', to: buchung.email, subject: betreff });

		} catch (err: any) {
			results.push({ id: buchung.id, status: 'error', error: err?.message ?? String(err) });
		}
	}

	return json({ targetDate: targetDateStr, dryRun, count: upcoming.length, results });
};
