import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';

const SESSION_TTL_DAYS = 30;

export interface SessionRecord {
	token: string;
	userId: string;
	email: string;
	name: string;
	createdAt: string;
	expiresAt: string;
}

function getSessionStore() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) throw new Error('Netlify Blobs: NETLIFY_SITE_ID oder NETLIFY_TOKEN fehlt');
	return getStore({ name: 'user_sessions', siteID, token });
}

export async function createSession(
	userId: string,
	email: string,
	name: string
): Promise<string> {
	const store = getSessionStore();
	const token = crypto.randomUUID();
	const record: SessionRecord = {
		token,
		userId,
		email,
		name,
		createdAt: new Date().toISOString(),
		expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
	};
	await store.setJSON(token, record);
	return token;
}

export async function getSession(token: string): Promise<SessionRecord | null> {
	if (!token) return null;
	const store = getSessionStore();
	const record = (await store.get(token, { type: 'json' })) as SessionRecord | null;
	if (!record) return null;
	if (new Date(record.expiresAt) < new Date()) {
		await store.delete(token);
		return null;
	}
	return record;
}

export async function deleteSession(token: string): Promise<void> {
	const store = getSessionStore();
	await store.delete(token);
}
