/**
 * Chat log for the admin (Feature `chatbot`): one blob per question + answer.
 *
 * Key: `<YYYY-MM-DD>/<conversation>/<timestamp>` (Swiss date) → list a month via prefix.
 * Stored: time, conversation id (random, per chat window), language, page, question, answer,
 * estimated cost, optional visitor rating (👍/👎 + comment). No IP address, no name. Entries older than RETENTION_DAYS are deleted
 * (whenever the admin page loads). Mentioned in the cookie banner / privacy page (ai_chat).
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';

export const RETENTION_DAYS = 90;

export type ChatLogEntry = {
	at: string; // ISO timestamp
	conversation: string;
	lang: string;
	page: string;
	question: string;
	answer: string;
	usd: number;
	/** Visitor rating of this answer (chat widget) */
	rating?: ChatRating;
	ratingComment?: string;
	ratedAt?: string;
	/** Feedback form (👎 with name/e-mail/comment) was mailed to the site owner — only once */
	feedbackMailedAt?: string;
};

export type ChatRating = 'up' | 'down';
export const RATING_COMMENT_MAX = 500;
/** Ratings are accepted for this long after the answer */
const RATING_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ChatConversation = {
	id: string;
	start: string;
	end: string;
	lang: string;
	page: string;
	usd: number;
	entries: ChatLogEntry[];
};

function getLogStore() {
	return getStore({
		name: 'chat_log',
		siteID: env.NETLIFY_SITE_ID ?? '',
		token: env.NETLIFY_TOKEN ?? '',
		consistency: 'strong'
	});
}

/** Swiss local date as YYYY-MM-DD */
const swissDay = (date = new Date()) =>
	date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

/** Random id from the chat widget (one per chat window) */
export const isValidConversationId = (value: unknown): value is string =>
	typeof value === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(value);

/** Stores question + answer; returns the entry id (blob key) for a later rating */
export async function recordChatExchange(entry: Omit<ChatLogEntry, 'at'>): Promise<string> {
	const now = new Date();
	const key = `${swissDay(now)}/${entry.conversation}/${now.getTime()}`;
	await getLogStore().setJSON(key, { ...entry, at: now.toISOString() } satisfies ChatLogEntry);
	return key;
}

export const isValidEntryId = (value: unknown): value is string =>
	typeof value === 'string' && /^\d{4}-\d{2}-\d{2}\/[a-zA-Z0-9-]{8,64}\/\d{10,16}$/.test(value);

/**
 * Visitor rating of one answer. Only the own conversation (the random id is known only to the
 * chat window) and only within RATING_WINDOW_MS; a new rating replaces the previous one.
 */
export async function rateChatExchange(
	entryId: string,
	conversation: string,
	rating: ChatRating,
	comment: string
): Promise<ChatLogEntry | null> {
	if (entryId.split('/')[1] !== conversation) return null;
	const store = getLogStore();
	const entry = (await store.get(entryId, { type: 'json' })) as ChatLogEntry | null;
	if (!entry || Date.now() - new Date(entry.at).getTime() > RATING_WINDOW_MS) return null;
	const updated: ChatLogEntry = {
		...entry,
		rating,
		ratingComment: comment.trim().slice(0, RATING_COMMENT_MAX) || undefined,
		ratedAt: new Date().toISOString()
	};
	await store.setJSON(entryId, updated);
	return updated;
}

/** Marks the feedback mail as sent (prevents a second mail for the same answer) */
export async function markFeedbackMailed(entryId: string, entry: ChatLogEntry): Promise<void> {
	await getLogStore().setJSON(entryId, {
		...entry,
		feedbackMailedAt: new Date().toISOString()
	} satisfies ChatLogEntry);
}

/**
 * Earlier questions + answers of a conversation (today and yesterday, oldest first).
 * The chat API builds the model history from this instead of trusting the browser,
 * so visitors cannot invent earlier «bot answers».
 */
export async function loadConversationHistory(
	conversation: string,
	maxExchanges: number
): Promise<{ question: string; answer: string }[]> {
	const store = getLogStore();
	const now = new Date();
	const days = [swissDay(new Date(now.getTime() - 86_400_000)), swissDay(now)];
	const keys = (
		await Promise.all(
			days.map(async (day) => {
				const { blobs } = await store.list({ prefix: `${day}/${conversation}/` });
				return blobs.map((b) => b.key);
			})
		)
	)
		.flat()
		// Key ends with the timestamp → chronological order
		.sort((a, b) => Number(a.split('/')[2]) - Number(b.split('/')[2]))
		.slice(-maxExchanges);
	const entries = await Promise.all(
		keys.map((key) => store.get(key, { type: 'json' }) as Promise<ChatLogEntry | null>)
	);
	return entries
		.filter((e): e is ChatLogEntry => !!e)
		.map((e) => ({ question: e.question, answer: e.answer }));
}

/** All keys of a month (prefix YYYY-MM) */
async function keysOf(prefix: string): Promise<string[]> {
	const { blobs } = await getLogStore().list({ prefix });
	return blobs.map((b) => b.key);
}

/** Conversations of a month, newest first */
export async function loadChatConversations(month: string): Promise<ChatConversation[]> {
	const store = getLogStore();
	const entries = (
		await Promise.all(
			(await keysOf(month)).map((key) => store.get(key, { type: 'json' }) as Promise<ChatLogEntry>)
		)
	).filter(Boolean);

	const byConversation = new Map<string, ChatLogEntry[]>();
	for (const entry of entries) {
		const list = byConversation.get(entry.conversation) ?? [];
		list.push(entry);
		byConversation.set(entry.conversation, list);
	}
	return [...byConversation.entries()]
		.map(([id, list]) => {
			list.sort((a, b) => a.at.localeCompare(b.at));
			return {
				id,
				start: list[0].at,
				end: list[list.length - 1].at,
				lang: list[0].lang,
				page: list[0].page,
				usd: list.reduce((sum, e) => sum + (e.usd || 0), 0),
				entries: list
			};
		})
		.sort((a, b) => b.end.localeCompare(a.end));
}

/** Deletes all entries of a conversation in the given month */
export async function deleteChatConversation(month: string, conversation: string): Promise<number> {
	const store = getLogStore();
	const keys = (await keysOf(month)).filter((key) => key.split('/')[1] === conversation);
	await Promise.all(keys.map((key) => store.delete(key)));
	return keys.length;
}

/** Deletes entries older than RETENTION_DAYS */
export async function purgeOldChatLogs(): Promise<void> {
	const cutoff = swissDay(new Date(Date.now() - RETENTION_DAYS * 86_400_000));
	const store = getLogStore();
	const old = (await keysOf('')).filter((key) => key.slice(0, 10) < cutoff);
	await Promise.all(old.map((key) => store.delete(key)));
}
