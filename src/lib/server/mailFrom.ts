/**
 * E-mail settings of the website — all from Prismic Settings (main language), no env vars:
 * - sender address «Absender-E-Mail» (`email_from_address`, domain verified in Resend)
 * - sender name «Absender-Name» (`email_from_name`; empty = website name, then company)
 * - internal notifications «Benachrichtigungen an (intern)» (`notification_email`;
 *   empty = «Verantwortliche E-Mail», then «Korrespondenz E-Mail»)
 *
 * Transition: while «Absender-E-Mail» is empty, the old env var EMAIL_FROM_ADDRESS is used
 * (warning in the log, «Inhalte prüfen» reports the empty field). Remove the fallback once all
 * sites have the field filled.
 */
import { env } from '$env/dynamic/private';
import { asText } from '@prismicio/client';
import { createClient } from '$lib/prismicio';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CACHE_MS = 5 * 60 * 1000;

type MailSettings = { address: string; name: string; notifyTo: string };
let cache: { value: MailSettings; at: number } | null = null;
let warned = false;

const email = (value: unknown) => {
	const v = String(value ?? '').trim();
	return EMAIL.test(v) ? v : '';
};

/** Sender address from settings data (main language); '' if missing or invalid */
export function mailFromSettings(data: unknown): string {
	return email((data as { email_from_address?: string } | null)?.email_from_address);
}

function fromSettings(data: any): MailSettings {
	let address = mailFromSettings(data);
	if (!address) {
		address = email(env.EMAIL_FROM_ADDRESS);
		if (address && !warned) {
			warned = true;
			console.warn(
				'[mail] Einstellungen → «Absender-E-Mail» ist leer — vorläufig wird EMAIL_FROM_ADDRESS verwendet. Bitte das Feld in Prismic ausfüllen.'
			);
		}
	}
	const siteTitle = Array.isArray(data?.site_title) ? asText(data.site_title) : data?.site_title;
	const name = [data?.email_from_name, data?.site_name, siteTitle, data?.responsible_person_company]
		.map((v) => String(v ?? '').trim())
		.find(Boolean);
	const notifyTo =
		email(data?.notification_email) || email(data?.responsible_email) || email(data?.e_mail);
	return { address, name: name ?? '', notifyTo };
}

async function loadMailSettings(fetchFn?: typeof fetch): Promise<MailSettings> {
	if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
	let data: unknown = null;
	try {
		// Without `lang` Prismic returns the main language
		data = (await createClient(fetchFn ? { fetch: fetchFn } : {}).getSingle('settings')).data;
	} catch (e) {
		console.error('[mail] Einstellungen konnten nicht geladen werden:', e);
	}
	const value = fromSettings(data);
	cache = { value, at: Date.now() };
	return value;
}

/** "Name" with quotes if needed (commas, special characters) */
const displayName = (name: string) =>
	/^[\p{L}\p{N} .'-]+$/u.test(name) ? name : `"${name.replace(/["\\<>\r\n]/g, '')}"`;

/**
 * Sender for the `from` of an e-mail: «Name <address>» (or only the address without a name).
 * '' = not configured → do not send.
 */
export async function getMailFrom(fetchFn?: typeof fetch): Promise<string> {
	const { address, name } = await loadMailSettings(fetchFn);
	if (!address) return '';
	return name ? `${displayName(name)} <${address}>` : address;
}

/** Only the sender address (as recipient, for checks or own name formatting) */
export async function getMailAddress(fetchFn?: typeof fetch): Promise<string> {
	return (await loadMailSettings(fetchFn)).address;
}

/** Recipient of internal notifications (bookings, forms, orders); '' = none set */
export async function getNotifyTo(fetchFn?: typeof fetch): Promise<string> {
	return (await loadMailSettings(fetchFn)).notifyTo;
}
