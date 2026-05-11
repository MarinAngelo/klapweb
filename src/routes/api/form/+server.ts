import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';

const SYSTEM_FIELDS = new Set(['form-name', 'bot-field', 'dienstleistung', 'subject']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^[0-9 +\-()]{4,25}$/;

export async function POST({ request, fetch }) {
	const params = new URLSearchParams(await request.text());

	const formName = params.get('form-name') ?? 'Kontaktformular';
	const subject = params.get('subject') || `Neue Nachricht via ${formName}`;

	const fields: { key: string; value: string }[] = [];
	for (const [key, value] of params.entries()) {
		if (SYSTEM_FIELDS.has(key) || !value.trim()) continue;
		if (key === 'email' && !EMAIL_RE.test(value)) return json({ ok: false }, { status: 400 });
		if (key === 'telnr' && !TEL_RE.test(value)) return json({ ok: false }, { status: 400 });
		fields.push({ key, value });
	}

	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.INVOICE_FROM_EMAIL;
	let toEmail = env.INVOICE_TO_EMAIL || '';

	if (!toEmail) {
		try {
			const client = createClient({ fetch });
			const settings = await client.getSingle('settings');
			const s = settings.data as any;
			toEmail = (s.responsible_email as string) || (s.e_mail as string) || '';
		} catch { /* ignore */ }
	}

	if (resendKey && emailFrom && toEmail) {
		try {
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);
			const { error } = await resend.emails.send({
				from: emailFrom,
				to: toEmail,
				subject,
				text: fields.map(({ key, value }) => `${key}:\n${value}`).join('\n\n')
			});
			if (error) {
				console.error('Resend error:', error);
				return json({ ok: false }, { status: 500 });
			}
		} catch (e) {
			console.error('Form email error:', e);
			return json({ ok: false }, { status: 500 });
		}
	}

	return json({ ok: true });
}
