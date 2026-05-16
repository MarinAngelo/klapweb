/**
 * Sofort-Ankunftserinnerung bei Bestätigung.
 *
 * Wird aufgerufen wenn eine Buchung bestätigt wird. Falls die Ankunft
 * innerhalb von 48 Stunden liegt (und der Reminder noch nicht gesendet wurde),
 * wird die Ankunftserinnerung sofort geschickt statt auf den Scheduler zu warten.
 */
import { createClient } from '$lib/prismicio';
import * as prismic from '@prismicio/client';
import { updateRessourceBuchung, type RessourceBuchung } from './ressourceBuchungen';
import { env } from '$env/dynamic/private';

function replaceTokens(html: string, tokens: Record<string, string>): string {
	return html.replace(/\{\{([^}]+)\}\}/g, (_, key) => tokens[key] ?? '');
}

function fmtDate(dateStr: string): string {
	const [y, m, d] = dateStr.split('-');
	return `${d}.${m}.${y}`;
}

function doorCode(uid: string): string {
	const key = uid.toUpperCase().replace(/-/g, '_');
	return (process.env[`DOOR_CODE_${key}`] || process.env.DOOR_CODE || '');
}

function dateInDays(n: number): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

export async function maybeSendAnkunftsErinnerung(
	buchung: RessourceBuchung,
	fetch: typeof globalThis.fetch
): Promise<void> {
	if (buchung.reminderSent) return;

	// Nur senden wenn Ankunft innerhalb von 48 Stunden liegt
	if (buchung.von > dateInDays(1)) return;

	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.INVOICE_FROM_EMAIL;
	if (!resendKey || !emailFrom || !buchung.email) return;

	try {
		const client = createClient({ fetch });
		const doc = await client.getByUID('ressource', buchung.ressourceUid);
		const d = doc.data as any;

		const textField = d.reminder_text as prismic.RichTextField | undefined;
		if (!textField?.length) {
			console.log(`[reminderMail] Kein reminder_text für ${buchung.ressourceUid} — übersprungen`);
			return;
		}

		const betreff = (d.reminder_betreff as string)?.trim()
			|| `Ihre Anreise: ${d.name ?? buchung.ressourceUid}`;

		const tokens: Record<string, string> = {
			Türcode:          doorCode(buchung.ressourceUid),
			Name:             buchung.name || '',
			Anreise:          fmtDate(buchung.von),
			Abreise:          fmtDate(buchung.bis),
			Buchungsreferenz: buchung.referenz ?? buchung.id
		};

		const html = replaceTokens(prismic.asHTML(textField) ?? '', tokens);

		const { Resend } = await import('resend');
		const { error } = await new Resend(resendKey).emails.send({
			from: emailFrom,
			to: buchung.email,
			subject: betreff,
			html
		});

		if (error) {
			console.error('[reminderMail] Ankunftserinnerung fehlgeschlagen:', error);
			return;
		}

		await updateRessourceBuchung(buchung.id, { reminderSent: true });
		console.log(`[reminderMail] Ankunftserinnerung sofort gesendet an ${buchung.email}`);
	} catch (err) {
		console.error('[reminderMail] Fehler:', err);
	}
}
