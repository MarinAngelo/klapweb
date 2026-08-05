/**
 * GET /api/test-reminder?secret=XXX&type=ankunft|nach_ankunft|abreise&date=YYYY-MM-DD&dryRun=true
 *
 * Runs the same logic as the send-reminders Netlify function.
 *
 * Parameters:
 *   secret  – must match ADMIN_SECRET env var
 *   type    – "ankunft" (default), "nach_ankunft", or "abreise"
 *   date    – target date (default: today+2 / today-1 / today+1)
 *   dryRun  – if "true", shows what would be sent without actually sending (default: false)
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getStore } from '@netlify/blobs';
import * as prismic from '@prismicio/client';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import type { RequestHandler } from './$types';
import { formatDateShort } from '$lib/utils/formatDate';

const formatDate = formatDateShort;

function replaceTokens(html: string, tokens: Record<string, string>): string {
	return html.replace(/\{\{([^}]+)\}\}/g, (_, key) => tokens[key] ?? '');
}

function dateInDays(days: number): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
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
	const typeParam = url.searchParams.get('type');
	const type =
		typeParam === 'abreise' ? 'abreise' : typeParam === 'nach_ankunft' ? 'nach_ankunft' : 'ankunft';

	if (!siteID || !token || !resendKey || !fromEmail || !repoName) {
		return json(
			{
				error: 'Fehlende Env-Variablen',
				siteID: !!siteID,
				token: !!token,
				resendKey: !!resendKey,
				fromEmail: !!fromEmail,
				repoName: !!repoName
			},
			{ status: 500 }
		);
	}

	const defaultDate =
		type === 'abreise' ? dateInDays(1) : type === 'nach_ankunft' ? dateInDays(-1) : dateInDays(2);
	const targetDateStr = url.searchParams.get('date') ?? defaultDate;

	const store = getStore({ name: 'ressource_buchungen', siteID, token });
	const { blobs } = await store.list();
	const allBookings = (
		await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))
	).filter(Boolean) as any[];

	const upcoming =
		type === 'abreise'
			? allBookings.filter((b) => b.bis === targetDateStr && b.email && !b.abreiseReminderSent)
			: type === 'nach_ankunft'
				? allBookings.filter(
						(b) => b.von === targetDateStr && b.email && !b.nachAnkunftReminderSent
					)
				: allBookings.filter((b) => b.von === targetDateStr && b.email && !b.reminderSent);

	const emptyMsg =
		type === 'abreise'
			? 'Keine Abreisen gefunden'
			: type === 'nach_ankunft'
				? 'Keine gestrigen Ankünfte gefunden'
				: 'Keine Ankünfte gefunden';

	if (upcoming.length === 0) {
		return json({ type, targetDate: targetDateStr, message: emptyMsg, dryRun });
	}

	const results: any[] = [];
	const client = prismic.createClient(repoName);
	const resend = dryRun ? null : new Resend(resendKey);

	for (const buchung of upcoming) {
		try {
			const doc = await client.getByUID('ressource', buchung.ressourceUid);
			const d = doc.data as any;

			const textField =
				type === 'abreise'
					? (d.abreise_text as any[] | undefined)
					: type === 'nach_ankunft'
						? (d.nach_ankunft_text as any[] | undefined)
						: (d.reminder_text as any[] | undefined);

			const fieldName =
				type === 'abreise'
					? 'abreise_text'
					: type === 'nach_ankunft'
						? 'nach_ankunft_text'
						: 'reminder_text';
			if (!textField?.length) {
				results.push({ id: buchung.id, status: 'skip', reason: `Kein ${fieldName}` });
				continue;
			}

			const betreff =
				type === 'abreise'
					? (d.abreise_betreff as string)?.trim() ||
						`Ihre Abreise morgen: ${d.name ?? buchung.ressourceUid}`
					: type === 'nach_ankunft'
						? (d.nach_ankunft_betreff as string)?.trim() ||
							`Willkommen: ${d.name ?? buchung.ressourceUid}`
						: (d.reminder_betreff as string)?.trim() ||
							`Ihre Anreise morgen: ${d.name ?? buchung.ressourceUid}`;

			const uidKey = buchung.ressourceUid.toUpperCase().replace(/-/g, '_');
			const doorCode = env[`DOOR_CODE_${uidKey}`] || env.DOOR_CODE || '';

			const html = replaceTokens(prismic.asHTML(textField) ?? '', {
				Türcode: doorCode,
				Name: buchung.name || '',
				Anreise: formatDate(buchung.von),
				Abreise: formatDate(buchung.bis),
				Buchungsreferenz: buchung.id || ''
			});

			if (dryRun) {
				results.push({
					id: buchung.id,
					status: 'dryRun',
					to: buchung.email,
					subject: betreff,
					html
				});
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

			const flagKey =
				type === 'abreise'
					? 'abreiseReminderSent'
					: type === 'nach_ankunft'
						? 'nachAnkunftReminderSent'
						: 'reminderSent';
			await store.setJSON(buchung.id, { ...buchung, [flagKey]: true });
			results.push({ id: buchung.id, status: 'sent', to: buchung.email, subject: betreff });

			// Betreiber-Bestätigung
			const typeLabel =
				type === 'abreise' ? 'Abreise' : type === 'nach_ankunft' ? 'Nach-Ankunft' : 'Ankunfts';
			const dateLabel = type === 'abreise' ? formatDate(buchung.bis) : formatDate(buchung.von);
			const dateFieldLabel = type === 'abreise' ? 'Abreise' : 'Anreise';
			await resend!.emails.send({
				from: fromEmail,
				to: fromEmail,
				subject: `✓ ${typeLabel}-Erinnerungsmail gesendet an ${buchung.email}`,
				html: `<p>Die ${typeLabel}-Erinnerung für <strong>${buchung.name || buchung.email}</strong>
				       (${buchung.ressourceUid}, ${dateFieldLabel} ${dateLabel})
				       wurde erfolgreich an <a href="mailto:${buchung.email}">${buchung.email}</a> gesendet.</p>
				       <p><strong>Betreff:</strong> ${betreff}</p>`
			});
		} catch (err: any) {
			results.push({ id: buchung.id, status: 'error', error: err?.message ?? String(err) });
		}
	}

	return json({ type, targetDate: targetDateStr, dryRun, count: upcoming.length, results });
};
