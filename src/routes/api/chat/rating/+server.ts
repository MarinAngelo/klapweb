import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '$lib/prismicio';
import { FEATURE_CHATBOT } from '$lib/server/features';
import {
	isValidConversationId,
	isValidEntryId,
	markFeedbackMailed,
	rateChatExchange,
	RATING_COMMENT_MAX,
	type ChatLogEntry
} from '$lib/server/chatLog';

/**
 * Visitor rating of a chat bot answer (👍/👎) → stored with the answer in the chat log
 * (admin «Chat-Bot»). With 👎 the visitor can leave name, e-mail and a comment: they are
 * mailed once to «Verantwortliche E-Mail» (Settings) and not stored in the log.
 *
 * Body: { entryId, conversationId, rating: 'up' | 'down', comment?, name?, email? }
 */

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 100;

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

async function sendFeedbackMail(
	fetchFn: typeof fetch,
	origin: string,
	entry: ChatLogEntry,
	name: string,
	email: string,
	comment: string
): Promise<boolean> {
	const resendKey = env.RESEND_API_KEY;
	const from = env.EMAIL_FROM_ADDRESS;
	let to = '';
	try {
		const settings = (await createClient({ fetch: fetchFn }).getSingle('settings')).data as any;
		to = settings.responsible_email || settings.e_mail || '';
	} catch {
		// no settings → no mail
	}
	if (!resendKey || !from || !to) {
		console.warn(
			'[chat] Feedback-Mail nicht gesendet: RESEND_API_KEY, EMAIL_FROM_ADDRESS oder Verantwortliche E-Mail fehlt'
		);
		return false;
	}

	const text = [
		'Ein Besucher war mit einer Antwort des Chat-Bots nicht zufrieden.',
		'',
		`Name: ${name || '–'}`,
		`E-Mail: ${email || '–'}`,
		`Kommentar: ${comment || '–'}`,
		'',
		`Frage: ${entry.question}`,
		'',
		`Antwort des Bots: ${entry.answer}`,
		'',
		`Seite: ${entry.page ? origin + entry.page : '–'} (${entry.lang || '–'})`,
		`Alle Gespräche: ${origin}/admin/chatbot?monat=${entry.at.slice(0, 7)}`
	].join('\n');

	const { Resend } = await import('resend');
	const { error } = await new Resend(resendKey).emails.send({
		from,
		to,
		...(email ? { replyTo: email } : {}),
		subject: `Chat-Bot: Rückmeldung${name ? ` von ${name}` : ''}`,
		text
	});
	if (error) console.error('[chat] Feedback-Mail fehlgeschlagen:', error);
	return !error;
}

export async function POST({ request, fetch, url }) {
	if (!FEATURE_CHATBOT) return json({ error: 'unavailable' }, { status: 404 });

	const body = await request.json().catch(() => null);
	const rating = body?.rating === 'up' || body?.rating === 'down' ? body.rating : null;
	const comment = str(body?.comment);
	const name = str(body?.name);
	const email = str(body?.email);
	if (
		!rating ||
		!isValidEntryId(body?.entryId) ||
		!isValidConversationId(body?.conversationId) ||
		comment.length > RATING_COMMENT_MAX ||
		name.length > NAME_MAX ||
		(email && (!EMAIL_RE.test(email) || email.length > 200))
	) {
		return json({ error: 'invalid' }, { status: 400 });
	}

	const entry = await rateChatExchange(body.entryId, body.conversationId, rating, comment).catch(
		(e) => {
			console.error('[chat] Bewertung konnte nicht gespeichert werden:', e);
			return null;
		}
	);
	if (!entry) return json({ error: 'failed' }, { status: 400 });

	// Feedback form: only for 👎 with content, only once per answer
	if (rating === 'down' && (comment || name || email) && !entry.feedbackMailedAt) {
		const sent = await sendFeedbackMail(fetch, url.origin, entry, name, email, comment).catch(
			(e) => {
				console.error('[chat] Feedback-Mail fehlgeschlagen:', e);
				return false;
			}
		);
		if (sent) await markFeedbackMailed(body.entryId, entry).catch(() => {});
	}
	return json({ ok: true });
}
