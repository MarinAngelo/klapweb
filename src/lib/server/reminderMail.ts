/**
 * Sofort-Ankunftserinnerung bei Bestätigung.
 *
 * Wird aufgerufen wenn eine Buchung bestätigt wird. Falls die Ankunft
 * innerhalb von 48 Stunden liegt (und der Reminder noch nicht gesendet wurde),
 * wird die Ankunftserinnerung sofort geschickt statt auf den Scheduler zu warten.
 */
import { createClient } from '$lib/prismicio';
import { loadMailTheme } from '$lib/mailLayout.js';
import { loadVariablesData, mailVariables } from '$lib/variables.js';
import { messengerButtonsHtml } from '$lib/messengerLinks.js';
import { updateRessourceBuchung, type RessourceBuchung } from './ressourceBuchungen';
import { env } from '$env/dynamic/private';
import {
	arrivalReminderMail,
	cmsReminderMail,
	getRessourceDocForBooking,
	reminderTokens,
	type CmsMailContext
} from './ressourceMail';
import { getMailFrom } from '$lib/server/mailFrom';
import { textStyleFrom } from '$lib/addressForm';

function doorCode(uid: string): string {
	const key = uid.toUpperCase().replace(/-/g, '_');
	// $env (not process.env): in dev only $env contains the values from .env
	return env[`DOOR_CODE_${key}`] || env.DOOR_CODE || '';
}

function dateInDays(n: number): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

export async function maybeSendAnkunftsErinnerung(
	buchung: RessourceBuchung,
	fetch: typeof globalThis.fetch,
	force = false
): Promise<void> {
	console.log(
		`[reminderMail] Start — buchungId=${buchung.id}, von=${buchung.von}, reminderSent=${buchung.reminderSent}, force=${force}`
	);

	if (!force && buchung.reminderSent) {
		console.log('[reminderMail] Übersprungen: reminderSent=true');
		return;
	}

	if (!force) {
		const grenze = dateInDays(2);
		if (buchung.von > grenze) {
			console.log(`[reminderMail] Übersprungen: von=${buchung.von} > grenze=${grenze}`);
			return;
		}
	}

	const resendKey = env.RESEND_API_KEY;
	const emailFrom = await getMailFrom();
	if (!resendKey || !emailFrom || !buchung.email) {
		console.log(
			`[reminderMail] Übersprungen: resendKey=${!!resendKey}, emailFrom=${!!emailFrom}, email=${buchung.email}`
		);
		return;
	}

	try {
		const client = createClient({ fetch });
		const [doc, settings, variablesData, mailTheme] = await Promise.all([
			getRessourceDocForBooking(client, buchung),
			client.getSingle('settings').catch(() => null),
			loadVariablesData(client),
			loadMailTheme(client, buchung.lang)
		]);
		// Variablen (incl. multi-line text) in the booking language, may contain booking tokens
		const cms: CmsMailContext = {
			doc: doc.data as Record<string, any>,
			vars: mailVariables(variablesData, buchung.lang),
			theme: mailTheme,
			style: textStyleFrom(settings?.data)
		};
		const waTel = (settings?.data as any)?.whatsapp_tel as string | undefined;
		const tokens = reminderTokens(
			buchung,
			doorCode(buchung.ressourceUid),
			messengerButtonsHtml(waTel)
		);
		if (!(cms.doc?.reminder_text as unknown[] | undefined)?.length) {
			console.log(
				`[reminderMail] reminder_text leer für ${buchung.ressourceUid} — sende Fallback-Mail`
			);
		}
		const { subject: betreff, html } = arrivalReminderMail(buchung, cms, tokens);

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

/** Sendet die Abreise-Erinnerung manuell für eine Buchung. */
export async function sendAbreiseErinnerung(
	buchung: RessourceBuchung,
	fetch: typeof globalThis.fetch,
	force = false
): Promise<{ sent: boolean; reason?: string }> {
	if (!force && buchung.abreiseReminderSent) return { sent: false, reason: 'already_sent' };

	const resendKey = env.RESEND_API_KEY;
	const emailFrom = await getMailFrom();
	if (!resendKey || !emailFrom || !buchung.email) {
		return { sent: false, reason: 'missing_config' };
	}

	try {
		const client = createClient({ fetch });
		const [doc, settings, variablesData, mailTheme] = await Promise.all([
			getRessourceDocForBooking(client, buchung),
			client.getSingle('settings').catch(() => null),
			loadVariablesData(client),
			loadMailTheme(client, buchung.lang)
		]);
		const cms: CmsMailContext = {
			doc: doc.data as Record<string, any>,
			vars: mailVariables(variablesData, buchung.lang),
			theme: mailTheme,
			style: textStyleFrom(settings?.data)
		};
		const waTel = (settings?.data as any)?.whatsapp_tel as string | undefined;
		const tokens = reminderTokens(
			buchung,
			doorCode(buchung.ressourceUid),
			messengerButtonsHtml(waTel)
		);
		const mail = cmsReminderMail(
			buchung,
			cms,
			tokens,
			'abreise',
			'Ihre Abreise morgen: {ressource}'
		);
		if (!mail) return { sent: false, reason: 'missing_abreise_text' };
		const { subject: betreff, html } = mail;

		const { Resend } = await import('resend');
		const { error } = await new Resend(resendKey).emails.send({
			from: emailFrom,
			to: buchung.email,
			subject: betreff,
			html
		});

		if (error) {
			console.error('[reminderMail] Abreiseerinnerung fehlgeschlagen:', error);
			return { sent: false, reason: 'send_error' };
		}

		await updateRessourceBuchung(buchung.id, { abreiseReminderSent: true });
		console.log(`[reminderMail] Abreiseerinnerung gesendet an ${buchung.email}`);
		return { sent: true };
	} catch (err) {
		console.error('[reminderMail] Abreiseerinnerung Fehler:', err);
		return { sent: false, reason: 'exception' };
	}
}
