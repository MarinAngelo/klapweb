import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';
import bcrypt from 'bcryptjs';

export interface UserRecord {
	id: string;
	email: string;
	passwordHash: string;
	name: string;
	verified: boolean;
	createdAt: string;
}

function getUserStore() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) throw new Error('Netlify Blobs: NETLIFY_SITE_ID oder NETLIFY_TOKEN fehlt');
	return getStore({ name: 'users', siteID, token });
}

// Separater Store für kurzlebige Tokens (Verifikation + Passwort-Reset)
// Key = Token-UUID → direkte Lookup ohne store.list()
function getTokenStore() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) throw new Error('Netlify Blobs: NETLIFY_SITE_ID oder NETLIFY_TOKEN fehlt');
	return getStore({ name: 'user_tokens', siteID, token });
}

interface TokenRecord {
	type: 'verify' | 'reset';
	email: string;
	expiresAt: string;
}

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export async function createUser(
	email: string,
	password: string,
	name: string
): Promise<{ user: UserRecord; verifyToken: string }> {
	const store = getUserStore();
	const tokenStore = getTokenStore();
	const key = normalizeEmail(email);

	const existing = await store.get(key, { type: 'json' });
	if (existing) throw new Error('E-Mail bereits registriert');

	const passwordHash = await bcrypt.hash(password, 12);
	const verifyToken = crypto.randomUUID();

	const user: UserRecord = {
		id: crypto.randomUUID(),
		email: key,
		passwordHash,
		name,
		verified: false,
		createdAt: new Date().toISOString()
	};

	const tokenRecord: TokenRecord = {
		type: 'verify',
		email: key,
		expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
	};

	await Promise.all([
		store.setJSON(key, user),
		tokenStore.setJSON(verifyToken, tokenRecord)
	]);

	return { user, verifyToken };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
	const store = getUserStore();
	return store.get(normalizeEmail(email), { type: 'json' }) as Promise<UserRecord | null>;
}

export async function verifyPassword(email: string, password: string): Promise<UserRecord | null> {
	const user = await getUserByEmail(email);
	if (!user) return null;
	const valid = await bcrypt.compare(password, user.passwordHash);
	return valid ? user : null;
}

export async function verifyEmail(token: string): Promise<boolean> {
	const tokenStore = getTokenStore();
	const record = (await tokenStore.get(token, { type: 'json' })) as TokenRecord | null;

	if (!record || record.type !== 'verify') return false;
	if (new Date(record.expiresAt) < new Date()) {
		await tokenStore.delete(token).catch(() => {});
		return false;
	}

	const store = getUserStore();
	const user = (await store.get(record.email, { type: 'json' })) as UserRecord | null;
	if (!user) return false;

	await Promise.all([
		store.setJSON(record.email, { ...user, verified: true }),
		tokenStore.delete(token)
	]);
	return true;
}

export async function setResetToken(
	email: string
): Promise<{ token: string; name: string } | null> {
	const store = getUserStore();
	const key = normalizeEmail(email);
	const user = (await store.get(key, { type: 'json' })) as UserRecord | null;
	if (!user) return null;

	const tokenStore = getTokenStore();
	const token = crypto.randomUUID();

	const tokenRecord: TokenRecord = {
		type: 'reset',
		email: key,
		expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
	};

	await tokenStore.setJSON(token, tokenRecord);
	return { token, name: user.name };
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
	const tokenStore = getTokenStore();
	const record = (await tokenStore.get(token, { type: 'json' })) as TokenRecord | null;

	if (!record || record.type !== 'reset') return false;
	if (new Date(record.expiresAt) < new Date()) {
		await tokenStore.delete(token).catch(() => {});
		return false;
	}

	const store = getUserStore();
	const user = (await store.get(record.email, { type: 'json' })) as UserRecord | null;
	if (!user) return false;

	const passwordHash = await bcrypt.hash(newPassword, 12);
	await Promise.all([
		store.setJSON(record.email, { ...user, passwordHash }),
		tokenStore.delete(token)
	]);
	return true;
}
