/**
 * Scheduled function: sends reminder emails 48h before arrival.
 *
 * Runs daily at 08:00 UTC.
 *
 * Required env vars:
 *   NETLIFY_SITE_ID, NETLIFY_TOKEN   – Blobs access
 *   RESEND_API_KEY                   – Email sending
 *   INVOICE_FROM_EMAIL               – Sender address
 *   PRISMIC_REPOSITORY_NAME          – Prismic repo (default: from slicemachine.config.json)
 *
 * Optional env vars for door codes:
 *   DOOR_CODE                        – Global fallback code
 *   DOOR_CODE_<UID>                  – Per-resource code (UID uppercased, hyphens → underscores)
 *                                      e.g. DOOR_CODE_CASA_CAMPELLI_OG
 *
 * Supported tokens in email text:
 *   {{Türcode}}   – door code from env vars above
 *   {{Name}}      – guest name
 *   {{Anreise}}   – arrival date (dd.mm.yyyy)
 *   {{Abreise}}   – departure date (dd.mm.yyyy)
 */

import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import * as prismic from '@prismicio/client';
import { Resend } from 'resend';
import { readFileSync } from 'fs';

export const config: Config = {
	schedule: '0 8 * * *'
};

function formatDate(dateStr: string): string {
	const [y, m, d] = dateStr.split('-');
	return `${d}.${m}.${y}`;
}

function replaceTokens(html: string, tokens: Record<string, string>): string {
	return html.replace(/\{\{([^}]+)\}\}/g, (_, key) => tokens[key] ?? '');
}

export default async function handler() {
	const siteID = process.env.NETLIFY_SITE_ID;
	const token = process.env.NETLIFY_TOKEN;
	const resendKey = process.env.RESEND_API_KEY;
	const fromEmail = process.env.INVOICE_FROM_EMAIL;
	const smConfig = JSON.parse(readFileSync('slicemachine.config.json', 'utf-8'));
	const repoName = process.env.PRISMIC_REPOSITORY_NAME || smConfig.repositoryName;

	if (!siteID || !token || !resendKey || !fromEmail) {
		console.error('[send-reminders] Fehlende Env-Variablen:', {
			siteID: !!siteID, token: !!token, resendKey: !!resendKey, fromEmail: !!fromEmail
		});
		return;
	}

	// Target: arrivals in exactly 48h (today + 2 days)
	const target = new Date();
	target.setUTCDate(target.getUTCDate() + 2);
	const targetDateStr = target.toISOString().slice(0, 10);

	// Load all bookings from Blobs
	const store = getStore({ name: 'ressource_buchungen', siteID, token });
	const { blobs } = await store.list();
	const allBookings = (await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }))
	)).filter(Boolean) as any[];

	const upcoming = allBookings.filter(
		(b) => b.von === targetDateStr && b.email && !b.reminderSent
	);

	if (upcoming.length === 0) {
		console.log(`[send-reminders] Keine Ankünfte am ${targetDateStr}`);
		return;
	}

	console.log(`[send-reminders] ${upcoming.length} Erinnerung(en) für ${targetDateStr}`);

	const client = prismic.createClient(repoName);
	const resend = new Resend(resendKey);

	for (const buchung of upcoming) {
		try {
			const doc = await client.getByUID('ressource', buchung.ressourceUid);
			const d = doc.data as any;

			const reminderField = d.reminder_text as any[] | undefined;
			if (!reminderField?.length) {
				console.log(`[send-reminders] Kein reminder_text für ${buchung.ressourceUid} – übersprungen`);
				continue;
			}

			const betreff = (d.reminder_betreff as string)?.trim()
				|| `Ihre Anreise morgen: ${d.name ?? buchung.ressourceUid}`;

			// Convert StructuredText → HTML
			let html = prismic.asHTML(reminderField) ?? '';

			// Door code: per-resource first, then global fallback
			const uidKey = buchung.ressourceUid.toUpperCase().replace(/-/g, '_');
			const doorCode = process.env[`DOOR_CODE_${uidKey}`] || process.env.DOOR_CODE || '';

			html = replaceTokens(html, {
				Türcode: doorCode,
				Name: buchung.name || '',
				Anreise: formatDate(buchung.von),
				Abreise: formatDate(buchung.bis)
			});

			const { error } = await resend.emails.send({
				from: fromEmail,
				to: buchung.email,
				subject: betreff,
				html
			});

			if (error) {
				console.error(`[send-reminders] E-Mail fehlgeschlagen für ${buchung.email}:`, error);
				continue;
			}

			// Mark as sent to avoid duplicates on retries
			await store.setJSON(buchung.id, { ...buchung, reminderSent: true });
			console.log(`[send-reminders] Erinnerung gesendet an ${buchung.email} (${buchung.ressourceUid})`);

		} catch (err) {
			console.error(`[send-reminders] Fehler bei Buchung ${buchung.id}:`, err);
		}
	}
}
