/**
 * Scheduled function: sends reminder emails.
 *
 * Runs daily at 08:00 UTC:
 *   → Ankunftserinnerung  (48h vor Anreise,   von = übermorgen)
 *   → Nach-Ankunft-Mail   (24h nach Ankunft,   von = gestern)
 * Runs daily at 20:00 UTC:
 *   → Abreiseerinnerung   (12h vor Abreise,    bis = morgen)
 *
 * After each guest email, a confirmation is sent to the operator (INVOICE_FROM_EMAIL).
 *
 * Required env vars:
 *   NETLIFY_SITE_ID, NETLIFY_TOKEN   – Blobs access
 *   RESEND_API_KEY                   – Email sending
 *   INVOICE_FROM_EMAIL               – Sender + operator notification recipient
 *   PRISMIC_REPOSITORY_NAME          – Prismic repo (default: from slicemachine.config.json)
 *
 * Optional:
 *   DOOR_CODE                        – Global fallback door code
 *   DOOR_CODE_<UID>                  – Per-resource code (UID uppercased, hyphens → underscores)
 *
 * Tokens supported in email text:
 *   {{Türcode}}, {{Name}}, {{Anreise}}, {{Abreise}}, {{Buchungsreferenz}}
 */

import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import * as prismic from '@prismicio/client';
import { Resend } from 'resend';
import { readFileSync } from 'fs';

export const config: Config = {
	schedule: '0 8,20 * * *'
};

function formatDate(dateStr: string): string {
	const [y, m, d] = dateStr.split('-');
	return `${d}.${m}.${y}`;
}

function replaceTokens(html: string, tokens: Record<string, string>): string {
	return html.replace(/\{\{([^}]+)\}\}/g, (_, key) => tokens[key] ?? '');
}

function dateInDays(days: number): string {
	// DATE_OVERRIDE=YYYY-MM-DD erlaubt lokale Tests mit künstlichem Datum
	const d = process.env.DATE_OVERRIDE ? new Date(process.env.DATE_OVERRIDE) : new Date();
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

async function sendMail(
	resend: Resend,
	fromEmail: string,
	buchung: any,
	betreff: string,
	html: string,
	typeLabel: string,
	dateLabel: string,
	dateFieldLabel: string
) {
	const { error } = await resend.emails.send({
		from: fromEmail,
		to: buchung.email,
		subject: betreff,
		html
	});
	if (error) return error;

	await resend.emails.send({
		from: fromEmail,
		to: fromEmail,
		subject: `✓ ${typeLabel} gesendet an ${buchung.email}`,
		html: `<p>${typeLabel} für <strong>${buchung.name || buchung.email}</strong>
		         (${buchung.ressourceUid}, ${dateFieldLabel} ${dateLabel})
		         wurde erfolgreich an <a href="mailto:${buchung.email}">${buchung.email}</a> gesendet.</p>
		         <p><strong>Betreff:</strong> ${betreff}</p>`
	});
	return null;
}

export default async function handler() {
	const siteID = process.env.NETLIFY_SITE_ID;
	const token = process.env.NETLIFY_TOKEN;
	const resendKey = process.env.RESEND_API_KEY;
	const fromEmail = process.env.INVOICE_FROM_EMAIL;

	let repoName = process.env.PRISMIC_REPOSITORY_NAME;
	if (!repoName) {
		try {
			repoName = JSON.parse(readFileSync('slicemachine.config.json', 'utf-8')).repositoryName;
		} catch (e) {
			console.error(
				'[send-reminders] slicemachine.config.json nicht lesbar — PRISMIC_REPOSITORY_NAME setzen:',
				e
			);
		}
	}

	if (!siteID || !token || !resendKey || !fromEmail || !repoName) {
		console.error('[send-reminders] Fehlende Env-Variablen/Konfiguration:', {
			siteID: !!siteID,
			token: !!token,
			resendKey: !!resendKey,
			fromEmail: !!fromEmail,
			repoName: !!repoName
		});
		return;
	}

	const hour = new Date().getUTCHours();
	const isAbreise = hour >= 18; // 20:00 UTC run

	const store = getStore({ name: 'ressource_buchungen', siteID, token });
	const { blobs } = await store.list();
	const allBookings = (
		await Promise.all(
			blobs.map((b) =>
				store.get(b.key, { type: 'json' }).catch((e) => {
					console.error('[send-reminders] Blob-Ladefehler:', e);
					return null;
				})
			)
		)
	).filter(Boolean) as any[];

	const client = prismic.createClient(repoName);
	const resend = new Resend(resendKey);

	const settings = await client.getSingle('settings').catch(() => null);
	const waTel = (settings?.data as any)?.whatsapp_tel as string | undefined;
	function whatsAppLink(): string {
		if (!waTel) return '';
		const number = waTel.replace(/[^\d]/g, '');
		return `<a href="https://wa.me/${number}" style="display:inline-block;background:#25d366;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-weight:600;">💬 WhatsApp</a>`;
	}

	function tokens(buchung: any, doorCode: string) {
		return {
			Türcode: doorCode,
			Name: buchung.name || '',
			Anreise: formatDate(buchung.von),
			Abreise: formatDate(buchung.bis),
			Buchungsreferenz: buchung.referenz || buchung.id || '',
			WhatsApp: whatsAppLink()
		};
	}

	function doorCode(uid: string) {
		const key = uid.toUpperCase().replace(/-/g, '_');
		return process.env[`DOOR_CODE_${key}`] || process.env.DOOR_CODE || '';
	}

	if (isAbreise) {
		// ── Abreise-Erinnerung: bis = morgen ────────────────────────────────────
		const targetDate = dateInDays(1);
		const upcoming = allBookings.filter(
			(b) => b.bis === targetDate && b.email && !b.abreiseReminderSent
		);
		console.log(`[send-reminders] Abreise-Erinnerungen für ${targetDate}: ${upcoming.length}`);

		for (const buchung of upcoming) {
			try {
				const doc = await client.getByUID('ressource', buchung.ressourceUid);
				const d = doc.data as any;

				const textField = d.abreise_text as any[] | undefined;
				if (!textField?.length) {
					console.log(
						`[send-reminders] Kein abreise_text für ${buchung.ressourceUid} – übersprungen`
					);
					continue;
				}

				const betreff =
					(d.abreise_betreff as string)?.trim() ||
					`Ihre Abreise morgen: ${d.name ?? buchung.ressourceUid}`;

				const html = replaceTokens(
					prismic.asHTML(textField) ?? '',
					tokens(buchung, doorCode(buchung.ressourceUid))
				);

				const error = await sendMail(
					resend,
					fromEmail,
					buchung,
					betreff,
					html,
					'Abreise-Erinnerungsmail',
					formatDate(buchung.bis),
					'Abreise'
				);
				if (error) {
					console.error(
						`[send-reminders] Abreise-Mail fehlgeschlagen für ${buchung.email}:`,
						error
					);
					continue;
				}

				await store.setJSON(buchung.id, { ...buchung, abreiseReminderSent: true });
				console.log(`[send-reminders] Abreise-Erinnerung gesendet an ${buchung.email}`);
			} catch (err) {
				console.error(`[send-reminders] Fehler bei Buchung ${buchung.id}:`, err);
			}
		}
	} else {
		// ── Ankunfts-Erinnerung: von = übermorgen ───────────────────────────────
		const ankunftDate = dateInDays(2);
		const ankunftUpcoming = allBookings.filter(
			(b) => b.von === ankunftDate && b.email && !b.reminderSent
		);
		console.log(
			`[send-reminders] Ankunfts-Erinnerungen für ${ankunftDate}: ${ankunftUpcoming.length}`
		);

		for (const buchung of ankunftUpcoming) {
			try {
				const doc = await client.getByUID('ressource', buchung.ressourceUid);
				const d = doc.data as any;

				const textField = d.reminder_text as any[] | undefined;
				if (!textField?.length) {
					console.log(
						`[send-reminders] Kein reminder_text für ${buchung.ressourceUid} – übersprungen`
					);
					continue;
				}

				const betreff =
					(d.reminder_betreff as string)?.trim() ||
					`Ihre Anreise morgen: ${d.name ?? buchung.ressourceUid}`;

				const html = replaceTokens(
					prismic.asHTML(textField) ?? '',
					tokens(buchung, doorCode(buchung.ressourceUid))
				);

				const error = await sendMail(
					resend,
					fromEmail,
					buchung,
					betreff,
					html,
					'Ankunfts-Erinnerungsmail',
					formatDate(buchung.von),
					'Anreise'
				);
				if (error) {
					console.error(
						`[send-reminders] Ankunfts-Mail fehlgeschlagen für ${buchung.email}:`,
						error
					);
					continue;
				}

				await store.setJSON(buchung.id, { ...buchung, reminderSent: true });
				console.log(`[send-reminders] Ankunfts-Erinnerung gesendet an ${buchung.email}`);
			} catch (err) {
				console.error(`[send-reminders] Fehler bei Buchung ${buchung.id}:`, err);
			}
		}

		// ── Nach-Ankunft-Mail: von = gestern ────────────────────────────────────
		const nachAnkunftDate = dateInDays(-1);
		const nachAnkunftUpcoming = allBookings.filter(
			(b) => b.von === nachAnkunftDate && b.email && !b.nachAnkunftReminderSent
		);
		console.log(
			`[send-reminders] Nach-Ankunft-Mails für ${nachAnkunftDate}: ${nachAnkunftUpcoming.length}`
		);

		for (const buchung of nachAnkunftUpcoming) {
			try {
				const doc = await client.getByUID('ressource', buchung.ressourceUid);
				const d = doc.data as any;

				const textField = d.nach_ankunft_text as any[] | undefined;
				if (!textField?.length) {
					console.log(
						`[send-reminders] Kein nach_ankunft_text für ${buchung.ressourceUid} – übersprungen`
					);
					continue;
				}

				const betreff =
					(d.nach_ankunft_betreff as string)?.trim() ||
					`Willkommen: ${d.name ?? buchung.ressourceUid}`;

				const html = replaceTokens(
					prismic.asHTML(textField) ?? '',
					tokens(buchung, doorCode(buchung.ressourceUid))
				);

				const error = await sendMail(
					resend,
					fromEmail,
					buchung,
					betreff,
					html,
					'Nach-Ankunft-Mail',
					formatDate(buchung.von),
					'Anreise'
				);
				if (error) {
					console.error(
						`[send-reminders] Nach-Ankunft-Mail fehlgeschlagen für ${buchung.email}:`,
						error
					);
					continue;
				}

				await store.setJSON(buchung.id, { ...buchung, nachAnkunftReminderSent: true });
				console.log(`[send-reminders] Nach-Ankunft-Mail gesendet an ${buchung.email}`);
			} catch (err) {
				console.error(`[send-reminders] Fehler bei Buchung ${buchung.id}:`, err);
			}
		}
	}
}
