/**
 * Chat log for the admin (Feature `chatbot`): one blob per question + answer.
 *
 * Key: `<YYYY-MM-DD>/<conversation>/<timestamp>` (Swiss date) → list a month via prefix.
 * Stored: time, conversation id (random, per chat window), language, page, question, answer,
 * estimated cost. No IP address, no name. Entries older than RETENTION_DAYS are deleted
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
};

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

export async function recordChatExchange(entry: Omit<ChatLogEntry, 'at'>): Promise<void> {
	const now = new Date();
	const key = `${swissDay(now)}/${entry.conversation}/${now.getTime()}`;
	await getLogStore().setJSON(key, { ...entry, at: now.toISOString() } satisfies ChatLogEntry);
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
