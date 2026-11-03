/**
 * Messenger apps for a phone number (Signal, Telegram, WhatsApp) — same apps and order as
 * the Kontakt slice on /kontakt. Used for the mail token {{Messenger-Apps}}.
 *
 * Plain JS without SvelteKit aliases: also imported by netlify/functions/send-reminders.ts.
 */

/** Phone number as international digits, e.g. "+41 76 572 15 28" → "41765721528" */
const digits = (/** @type {string} */ tel) => tel.replace(/[^\d]/g, '');

export const MESSENGER_APPS = [
	{
		app: 'Signal',
		color: '#3a76f0',
		href: (/** @type {string} */ tel) => `https://signal.me/#p/+${digits(tel)}`
	},
	{
		app: 'Telegram',
		color: '#229ED9',
		href: (/** @type {string} */ tel) => `https://t.me/+${digits(tel)}`
	},
	{
		app: 'WhatsApp',
		color: '#25d366',
		href: (/** @type {string} */ tel) => `https://wa.me/${digits(tel)}`
	}
];

/**
 * E-mail safe buttons (inline styles) for all messenger apps, empty without number
 * @param {string | null | undefined} tel
 */
export function messengerButtonsHtml(tel) {
	if (!tel || !digits(tel)) return '';
	const buttons = MESSENGER_APPS.map(
		({ app, color, href }) =>
			`<a href="${href(tel)}" style="display:inline-block;background:${color};color:#fff;padding:8px 18px;margin:0 8px 8px 0;border-radius:6px;text-decoration:none;font-weight:600;">${app}</a>`
	).join('');
	return `<div>${buttons}</div>`;
}
