/**
 * Newsletter / Info-Mails an Kunden (Feature `newsletter`).
 *
 * - Inhalt: Custom Type `newsletter` in Prismic (Betreff, Vorschautext, Rich Text, optionaler Button)
 * - Platzhalter: {{Name}} (Vor- + Nachname, sonst Firma), {{Vorname}}, {{Nachname}}, {{Firma}}, {{Email}}
 * - Empfänger: alle Kunden aus dem Blob-Store `kunden` mit E-Mail + bestätigte Abonnenten
 *   (Formular-Variante "Newsletter abonnieren", Double-Opt-in), dedupliziert, ohne Abgemeldete
 * - Versand: Resend Batch-API (max. 100 pro Aufruf), pro Empfänger eigener Abmelde-Link
 * - Schweizer Recht (UWG Art. 3 lit. o): Absender-Angaben + Abmeldemöglichkeit in jeder Mail
 *
 * Blob-Stores:
 *   newsletter_versand     — ein Eintrag pro Versand (Verlauf im Admin)
 *   newsletter_abmeldungen — Key = SHA-256 der E-Mail (keine Klartext-Adressen als Key)
 *   newsletter_abonnenten  — bestätigte Anmeldungen aus dem Formular, Key = SHA-256 der E-Mail
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import * as prismic from '@prismicio/client';
import { listCustomers } from '$lib/server/customers';
import { t } from '$lib/i18n/translations';

export type NewsletterRecipient = {
	email: string;
	vorname?: string;
	nachname?: string;
	firma?: string;
	/** kunde = from the customer store, abonnent = confirmed newsletter sign-up */
	source?: 'kunde' | 'abonnent';
};

export type NewsletterSubscriber = {
	email: string;
	vorname?: string;
	nachname?: string;
	lang?: string;
	confirmedAt: string;
};

export type NewsletterSendRecord = {
	id: string;
	uid: string;
	subject: string;
	sentAt: string;
	recipientCount: number;
	failedCount: number;
	errors?: string[];
	/** 'alle' = all customers, 'auswahl' = selected customers (older records: undefined = alle) */
	mode?: 'alle' | 'auswahl';
};

type NewsletterDoc = prismic.PrismicDocument<Record<string, any>, 'newsletter'>;

// ── Stores ────────────────────────────────────────────────────────────────────

function store(name: string) {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) {
		throw new Error(
			`Netlify Blobs: NETLIFY_SITE_ID=${siteID ? 'gesetzt' : 'fehlt'}, NETLIFY_TOKEN=${token ? 'gesetzt' : 'fehlt'}`
		);
	}
	return getStore({ name, siteID, token });
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const emailKey = (email: string) =>
	createHash('sha256').update(normalizeEmail(email)).digest('hex');

// ── Abmeldung ───────────────────────────────────────────────────────────────────

function unsubscribeSecret(): string {
	const secret = env.NEWSLETTER_SECRET || env.ADMIN_SECRET;
	if (!secret) throw new Error('NEWSLETTER_SECRET bzw. ADMIN_SECRET fehlt');
	return secret;
}

export function unsubscribeToken(email: string): string {
	return createHmac('sha256', unsubscribeSecret())
		.update(normalizeEmail(email))
		.digest('base64url');
}

export function isValidUnsubscribeToken(email: string, token: string): boolean {
	if (!email || !token) return false;
	const expected = Buffer.from(unsubscribeToken(email));
	const actual = Buffer.from(token);
	return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function unsubscribeUrl(origin: string, email: string): string {
	const params = new URLSearchParams({ e: normalizeEmail(email), t: unsubscribeToken(email) });
	return `${origin}/newsletter/abmelden?${params}`;
}

export async function addUnsubscribe(email: string): Promise<void> {
	await store('newsletter_abmeldungen').setJSON(emailKey(email), {
		at: new Date().toISOString()
	});
}

export async function countUnsubscribed(): Promise<number> {
	const { blobs } = await store('newsletter_abmeldungen').list();
	return blobs.length;
}

async function unsubscribedKeys(): Promise<Set<string>> {
	const { blobs } = await store('newsletter_abmeldungen').list();
	return new Set(blobs.map((b) => b.key));
}

// ── Empfänger ─────────────────────────────────────────────────────────────────

/** All customers with a valid e-mail, deduplicated, without unsubscribed addresses */
export async function getRecipients(): Promise<NewsletterRecipient[]> {
	const [customers, subscribers, unsubscribed] = await Promise.all([
		listCustomers(),
		listSubscribers(),
		unsubscribedKeys()
	]);
	const byEmail = new Map<string, NewsletterRecipient>();
	const add = (recipient: NewsletterRecipient) => {
		if (!isValidEmail(recipient.email)) return;
		const email = normalizeEmail(recipient.email);
		if (unsubscribed.has(emailKey(email)) || byEmail.has(email)) return;
		byEmail.set(email, { ...recipient, email });
	};
	// Customers first: their data (company etc.) wins over a sign-up with the same address
	for (const c of customers) {
		if (c.email) {
			add({
				email: c.email,
				vorname: c.vorname,
				nachname: c.nachname,
				firma: c.firma,
				source: 'kunde'
			});
		}
	}
	for (const sub of subscribers) {
		add({ email: sub.email, vorname: sub.vorname, nachname: sub.nachname, source: 'abonnent' });
	}
	return [...byEmail.values()];
}

// ── Abonnenten (Double-Opt-in) ───────────────────────────────────────────────

const SUBSCRIBE_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const isValidEmail = (email: string | undefined | null) =>
	!!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

type SubscribeData = { email: string; vorname?: string; nachname?: string; lang?: string };

function sign(value: string): string {
	return createHmac('sha256', unsubscribeSecret()).update(value).digest('base64url');
}

/** Stateless confirmation link: data + expiry signed with the newsletter secret (nothing stored before confirmation) */
export function subscribeConfirmUrl(origin: string, data: SubscribeData): string {
	const payload = Buffer.from(
		JSON.stringify({
			...data,
			email: normalizeEmail(data.email),
			exp: Date.now() + SUBSCRIBE_LINK_TTL_MS
		})
	).toString('base64url');
	const params = new URLSearchParams({ d: payload, s: sign('subscribe:' + payload) });
	return `${origin}/newsletter/bestaetigen?${params}`;
}

/** Returns the sign-up data if the link is authentic and not expired, otherwise null */
export function readSubscribeConfirm(payload: string, signature: string): SubscribeData | null {
	if (!payload || !signature) return null;
	const expected = Buffer.from(sign('subscribe:' + payload));
	const actual = Buffer.from(signature);
	if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
	try {
		const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
		if (typeof data.exp !== 'number' || data.exp < Date.now() || !isValidEmail(data.email))
			return null;
		return { email: data.email, vorname: data.vorname, nachname: data.nachname, lang: data.lang };
	} catch {
		return null;
	}
}

/** Saves a confirmed sign-up; a previous unsubscribe of this address is lifted (explicit new consent) */
export async function addSubscriber(data: SubscribeData): Promise<void> {
	const key = emailKey(data.email);
	const record: NewsletterSubscriber = {
		email: normalizeEmail(data.email),
		vorname: data.vorname || undefined,
		nachname: data.nachname || undefined,
		lang: data.lang || undefined,
		confirmedAt: new Date().toISOString()
	};
	await store('newsletter_abonnenten').setJSON(key, record);
	await store('newsletter_abmeldungen').delete(key);
}

/** Subscribers with their current status (unsubscribed via link = still listed as proof of consent) */
export async function listSubscribersWithStatus(): Promise<
	(NewsletterSubscriber & { unsubscribed: boolean })[]
> {
	const [subscribers, unsubscribed] = await Promise.all([listSubscribers(), unsubscribedKeys()]);
	return subscribers
		.map((sub) => ({ ...sub, unsubscribed: unsubscribed.has(emailKey(sub.email)) }))
		.sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt));
}

/**
 * Removes a subscriber (admin) and marks the address as unsubscribed,
 * so it also gets no info mails as a customer.
 */
export async function removeSubscriber(email: string): Promise<boolean> {
	const key = emailKey(email);
	const s = store('newsletter_abonnenten');
	if (!(await s.get(key))) return false;
	await s.delete(key);
	await addUnsubscribe(email);
	return true;
}

export async function listSubscribers(): Promise<NewsletterSubscriber[]> {
	const s = store('newsletter_abonnenten');
	const { blobs } = await s.list();
	const records = await Promise.all(
		blobs.map((b) => s.get(b.key, { type: 'json' }) as Promise<NewsletterSubscriber>)
	);
	return records.filter(Boolean);
}

// ── Rendering ─────────────────────────────────────────────────────────────────

const escapeHtml = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
	);

function applyTokens(text: string, recipient?: NewsletterRecipient, html = true): string {
	const fullName = [recipient?.vorname, recipient?.nachname]
		.map((part) => part?.trim())
		.filter(Boolean)
		.join(' ');
	const tokens: Record<string, string> = {
		// {{Name}}: first + last name, falls back to company (e.g. customers without a person)
		Name: fullName || recipient?.firma?.trim() || '',
		Vorname: recipient?.vorname ?? '',
		Nachname: recipient?.nachname ?? '',
		Firma: recipient?.firma ?? '',
		Email: recipient?.email ?? ''
	};
	return text.replace(/\{\{\s*([A-Za-z]+)\s*\}\}/g, (match, key) =>
		key in tokens ? (html ? escapeHtml(tokens[key]) : tokens[key]) : match
	);
}

export type NewsletterBranding = {
	siteName: string;
	sender: string; // company / responsible person
	address: string; // postal address (plain text, one line)
	color: string;
	accent: string;
};

const TEXT_STYLE = 'margin:0 0 16px;font-size:16px;line-height:1.6;';

function bodyHtml(
	field: prismic.RichTextField,
	branding: NewsletterBranding,
	origin: string
): string {
	const absolute = (href: string | null | undefined) =>
		!href ? '#' : href.startsWith('/') ? origin + href : href;
	const heading =
		(size: number) =>
		({ children }: { children: string }) =>
			`<p style="margin:24px 0 12px;font-size:${size}px;line-height:1.3;font-weight:700;color:${branding.color};">${children}</p>`;
	return (
		prismic.asHTML(field, {
			serializer: {
				heading1: heading(26),
				heading2: heading(22),
				heading3: heading(19),
				heading4: heading(17),
				heading5: heading(16),
				heading6: heading(16),
				paragraph: ({ children }) => `<p style="${TEXT_STYLE}">${children}</p>`,
				list: ({ children }) => `<ul style="margin:0 0 16px;padding-left:22px;">${children}</ul>`,
				oList: ({ children }) => `<ol style="margin:0 0 16px;padding-left:22px;">${children}</ol>`,
				listItem: ({ children }) =>
					`<li style="margin:0 0 6px;font-size:16px;line-height:1.6;">${children}</li>`,
				oListItem: ({ children }) =>
					`<li style="margin:0 0 6px;font-size:16px;line-height:1.6;">${children}</li>`,
				image: ({ node }) =>
					`<p style="margin:0 0 16px;"><img src="${node.url}" alt="${escapeHtml(node.alt ?? '')}" width="${Math.min(node.dimensions.width, 560)}" style="display:block;max-width:100%;height:auto;border-radius:8px;"></p>`,
				hyperlink: ({ node, children }) =>
					`<a href="${absolute(prismic.asLink(node.data))}" style="color:${branding.accent};text-decoration:underline;">${children}</a>`
			}
		}) ?? ''
	);
}

/** Shared e-mail layout: header with site name, content, footer with sender details */
export function mailLayout(
	branding: NewsletterBranding,
	options: { lang: string; subject: string; preheader?: string; content: string; footer: string }
): string {
	return `<!DOCTYPE html>
<html lang="${options.lang.slice(0, 2)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(options.subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#27272a;">
<div style="display:none;max-height:0;overflow:hidden;">${options.preheader ?? ''}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:${branding.color};padding:20px 28px;color:#ffffff;font-size:20px;font-weight:700;">${escapeHtml(branding.siteName)}</td></tr>
<tr><td style="padding:28px;">${options.content}</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.5;color:#71717a;">
${escapeHtml(branding.sender)}${branding.address ? `<br>${escapeHtml(branding.address)}` : ''}<br><br>
${options.footer}
</td></tr>
</table></td></tr></table>
</body></html>`;
}

const buttonHtml = (href: string, label: string, color: string) =>
	`<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:${color};color:#ffffff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;">${escapeHtml(label)}</a></p>`;

/** Renders the newsletter as e-mail HTML + plain-text version for one recipient */
export function renderNewsletter(
	doc: NewsletterDoc,
	branding: NewsletterBranding,
	options: { recipient?: NewsletterRecipient; unsubscribeLink: string; linkResolverOrigin: string }
): { subject: string; html: string; text: string } {
	const d = doc.data;
	const lang = doc.lang || 'de-ch';
	const subject = applyTokens(d.subject || '', options.recipient, false);
	const preheader = d.preheader ? escapeHtml(d.preheader) : '';
	const ctaHref = prismic.isFilled.link(d.cta_link) ? prismic.asLink(d.cta_link) : null;
	const ctaUrl = ctaHref?.startsWith('/') ? options.linkResolverOrigin + ctaHref : ctaHref;
	const cta = d.cta_label && ctaUrl ? buttonHtml(ctaUrl, d.cta_label, branding.accent) : '';
	const body = applyTokens(
		bodyHtml(d.body, branding, options.linkResolverOrigin),
		options.recipient
	);

	const reason =
		options.recipient?.source === 'abonnent'
			? t('Sie erhalten diese E-Mail, weil Sie die Info-Mails abonniert haben von', lang)
			: t('Sie erhalten diese E-Mail als Kundin oder Kunde von', lang);
	const html = mailLayout(branding, {
		lang,
		subject,
		preheader,
		content: body + cta,
		footer: `${escapeHtml(reason)} ${escapeHtml(branding.sender || branding.siteName)}.
<a href="${options.unsubscribeLink}" style="color:#71717a;">${escapeHtml(t('Keine weiteren Info-Mails erhalten', lang))}</a>`
	});

	const text = [
		applyTokens(prismic.asText(d.body, { separator: '\n\n' }) ?? '', options.recipient, false),
		d.cta_label && ctaUrl ? `${d.cta_label}: ${ctaUrl}` : '',
		'—',
		[branding.sender, branding.address].filter(Boolean).join(', '),
		`${t('Keine weiteren Info-Mails erhalten', lang)}: ${options.unsubscribeLink}`
	]
		.filter(Boolean)
		.join('\n\n');

	return { subject, html, text };
}

/** Loads settings (in the given language) + active theme from Prismic and builds the branding */
export async function loadBranding(
	client: { getSingle: Function; getAllByType: Function },
	lang: string
): Promise<NewsletterBranding> {
	const [settings, themes] = await Promise.all([
		client.getSingle('settings', { lang }).catch(() => null),
		client.getAllByType('theme', { lang: '*' }).catch(() => [])
	]);
	const theme = (themes as prismic.PrismicDocument[]).find((th) => th.data?.activ === true) ?? null;
	return brandingFromSettings(settings, theme);
}

/** Branding from Prismic settings/theme (falls back to neutral colours) */
export function brandingFromSettings(
	settings: prismic.PrismicDocument | null,
	theme: prismic.PrismicDocument | null
): NewsletterBranding {
	const s = (settings?.data ?? {}) as Record<string, any>;
	const t = (theme?.data ?? {}) as Record<string, any>;
	const siteName = s.site_name || prismic.asText(s.site_title) || '';
	return {
		siteName,
		sender: s.responsible_person_company || siteName,
		address: (prismic.asText(s.responsible_address) ?? '').replace(/\s*\n\s*/g, ', '),
		color: t.header_bg_color || '#27272a',
		accent: t.page_button_bg_color || t.header_bg_color || '#2563eb'
	};
}

// ── Versand ───────────────────────────────────────────────────────────────────

const BATCH_SIZE = 100;

/**
 * Sends the newsletter to the given recipients via Resend (batches of 100).
 * Each recipient gets a personal unsubscribe link + List-Unsubscribe headers (one-click).
 */
export async function sendNewsletter(
	doc: NewsletterDoc,
	branding: NewsletterBranding,
	recipients: NewsletterRecipient[],
	origin: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
	const resendKey = env.RESEND_API_KEY;
	const fromEmail = env.EMAIL_FROM_ADDRESS;
	if (!resendKey || !fromEmail) throw new Error('RESEND_API_KEY / EMAIL_FROM_ADDRESS fehlt');

	const { Resend } = await import('resend');
	const resend = new Resend(resendKey);
	const from = branding.sender ? `${branding.sender} <${fromEmail}>` : fromEmail;

	let sent = 0;
	let failed = 0;
	const errors: string[] = [];
	for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
		const chunk = recipients.slice(i, i + BATCH_SIZE);
		const payload = chunk.map((recipient) => {
			const link = unsubscribeUrl(origin, recipient.email);
			const oneClick = `${origin}/api/newsletter/abmelden?${new URL(link).searchParams}`;
			const mail = renderNewsletter(doc, branding, {
				recipient,
				unsubscribeLink: link,
				linkResolverOrigin: origin
			});
			return {
				from,
				to: recipient.email,
				subject: mail.subject,
				html: mail.html,
				text: mail.text,
				headers: {
					'List-Unsubscribe': `<${oneClick}>`,
					'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
				}
			};
		});
		const { error } = await resend.batch.send(payload);
		if (error) {
			failed += chunk.length;
			errors.push(error.message);
		} else {
			sent += chunk.length;
		}
	}
	return { sent, failed, errors };
}

export async function logSend(record: Omit<NewsletterSendRecord, 'id'>): Promise<void> {
	const id = `${Date.now()}_${crypto.randomUUID()}`;
	await store('newsletter_versand').setJSON(id, { id, ...record });
}

export async function listSends(): Promise<NewsletterSendRecord[]> {
	const s = store('newsletter_versand');
	const { blobs } = await s.list();
	const records = await Promise.all(
		blobs.map((b) => s.get(b.key, { type: 'json' }) as Promise<NewsletterSendRecord>)
	);
	return records.filter(Boolean).sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

/** Sends the double-opt-in confirmation mail for a newsletter sign-up */
export async function sendSubscribeConfirmation(
	data: SubscribeData,
	branding: NewsletterBranding,
	origin: string
): Promise<void> {
	const resendKey = env.RESEND_API_KEY;
	const fromEmail = env.EMAIL_FROM_ADDRESS;
	if (!resendKey || !fromEmail) throw new Error('RESEND_API_KEY / EMAIL_FROM_ADDRESS fehlt');

	const lang = data.lang || 'de-ch';
	const link = subscribeConfirmUrl(origin, data);
	const name = [data.vorname, data.nachname].filter(Boolean).join(' ');
	const subject = t('Bitte bestätigen Sie Ihre Anmeldung für die Info-Mails', lang);
	const greeting = name ? `${t('Guten Tag', lang)} ${name}` : t('Guten Tag', lang);
	const intro = t(
		'Sie haben sich für die Info-Mails angemeldet. Bitte bestätigen Sie Ihre Anmeldung mit einem Klick auf den Button. Der Link ist 7 Tage gültig.',
		lang
	);
	const ignore = t(
		'Falls Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail einfach.',
		lang
	);
	const button = t('Anmeldung bestätigen', lang);

	const html = mailLayout(branding, {
		lang,
		subject,
		content: `<p style="${TEXT_STYLE}">${escapeHtml(greeting)}</p><p style="${TEXT_STYLE}">${escapeHtml(intro)}</p>${buttonHtml(link, button, branding.accent)}<p style="${TEXT_STYLE}color:#71717a;font-size:14px;">${escapeHtml(ignore)}</p>`,
		footer: ''
	});
	const text = [
		greeting,
		intro,
		`${button}: ${link}`,
		ignore,
		'—',
		[branding.sender, branding.address].filter(Boolean).join(', ')
	].join('\n\n');

	const { Resend } = await import('resend');
	const { error } = await new Resend(resendKey).emails.send({
		from: branding.sender ? `${branding.sender} <${fromEmail}>` : fromEmail,
		to: data.email,
		subject,
		html,
		text
	});
	if (error) throw new Error(error.message);
}
