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
	return process.env[`DOOR_CODE_${key}`] || process.env.DOOR_CODE || '';
}

function whatsAppLink(tel: string): string {
	const number = tel.replace(/[^\d]/g, '');
	return `<a href="https://wa.me/${number}" style="display:inline-block;background:#25d366;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-weight:600;">💬 WhatsApp</a>`;
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
	console.log(
		`[reminderMail] Start — buchungId=${buchung.id}, von=${buchung.von}, reminderSent=${buchung.reminderSent}`
	);

	if (buchung.reminderSent) {
		console.log('[reminderMail] Übersprungen: reminderSent=true');
		return;
	}

	const grenze = dateInDays(2);
	if (buchung.von > grenze) {
		console.log(`[reminderMail] Übersprungen: von=${buchung.von} > grenze=${grenze}`);
		return;
	}

	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.INVOICE_FROM_EMAIL;
	if (!resendKey || !emailFrom || !buchung.email) {
		console.log(
			`[reminderMail] Übersprungen: resendKey=${!!resendKey}, emailFrom=${!!emailFrom}, email=${buchung.email}`
		);
		return;
	}

	try {
		const client = createClient({ fetch });
		const [doc, settings] = await Promise.all([
			client.getByUID('ressource', buchung.ressourceUid),
			client.getSingle('settings').catch(() => null)
		]);
		const d = doc.data as any;

		const textField = d.reminder_text as prismic.RichTextField | undefined;
		const waTel = (settings?.data as any)?.whatsapp_tel as string | undefined;
		const tokens: Record<string, string> = {
			Türcode: doorCode(buchung.ressourceUid),
			Name: buchung.name || '',
			Anreise: fmtDate(buchung.von),
			Abreise: fmtDate(buchung.bis),
			Buchungsreferenz: buchung.referenz ?? buchung.id,
			WhatsApp: waTel ? whatsAppLink(waTel) : ''
		};

		const betreff =
			(d.reminder_betreff as string)?.trim() || `Ihre Anreise: ${d.name ?? buchung.ressourceUid}`;

		let html: string;
		if (textField?.length) {
			html = replaceTokens(prismic.asHTML(textField) ?? '', tokens);
		} else {
			// Fallback wenn reminder_text in Prismic nicht gesetzt
			console.log(
				`[reminderMail] reminder_text leer für ${buchung.ressourceUid} — sende Fallback-Mail`
			);
			html = `<p>Hallo ${tokens.Name},</p>
<p>wir freuen uns auf Ihre Anreise am <strong>${tokens.Anreise}</strong> (Abreise: ${tokens.Abreise}).</p>
${tokens.Türcode ? `<p><strong>Türcode:</strong> ${tokens.Türcode}</p>` : ''}
${tokens.WhatsApp ? `<p>Bei Fragen: ${tokens.WhatsApp}</p>` : ''}
<p>Referenz: ${tokens.Buchungsreferenz}</p>`;
		}

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
