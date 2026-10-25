/**
 * Admin-Anmeldung (ersetzt `?secret=<ADMIN_SECRET>` in URLs).
 *
 * - Login unter /admin: Passwort = ADMIN_SECRET → signiertes Session-Cookie (HttpOnly, 8 h)
 * - Alle /admin/*-Seiten werden zentral in hooks.server.ts geschützt
 * - Links in E-Mails (Freigaben, Bestätigungen) tragen ein eigenes Token pro Aktion + ID
 *   statt des Admin-Passworts: ein weitergeleitetes Mail gibt keinen Admin-Zugang frei
 *
 * Wird ADMIN_SECRET geändert, sind alle Sessions und alle Aktions-Links ungültig.
 */
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Cookies } from '@sveltejs/kit';

export const ADMIN_COOKIE = 'admin_session';
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function hmac(purpose: string, value: string): string {
	const secret = env.ADMIN_SECRET;
	if (!secret) throw new Error('ADMIN_SECRET fehlt');
	return createHmac('sha256', `${purpose}:${secret}`).update(value).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Password check in constant time (compares fixed-length hashes) */
export function isValidAdminPassword(password: string | null | undefined): boolean {
	const secret = env.ADMIN_SECRET;
	if (!secret || !password) return false;
	const digest = (value: string) => createHmac('sha256', 'admin-login').update(value).digest();
	return timingSafeEqual(digest(password), digest(secret));
}

export function startAdminSession(cookies: Cookies): void {
	const exp = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
	cookies.set(ADMIN_COOKIE, `${exp}.${hmac('admin-session', exp)}`, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: SESSION_MAX_AGE_SECONDS
	});
}

export function endAdminSession(cookies: Cookies): void {
	cookies.delete(ADMIN_COOKIE, { path: '/' });
}

export function isAdmin(cookies: Cookies): boolean {
	const value = cookies.get(ADMIN_COOKIE);
	if (!value || !env.ADMIN_SECRET) return false;
	const [exp, signature] = value.split('.');
	if (!exp || !signature || !safeEqual(signature, hmac('admin-session', exp))) return false;
	return Number(exp) > Date.now();
}

// ── Aktions-Links in E-Mails ──────────────────────────────────────────────────

export type AdminAction = 'freigabe-aufgabe' | 'bestaetige-buchung' | 'freigabe-abrechnung';

/** Token that authorises exactly one action for one id (no admin access) */
export function adminActionToken(action: AdminAction, id: string): string {
	return hmac('admin-action', `${action}:${id}`);
}

/**
 * Authorisation for e-mail action links: action token, admin session,
 * or (transition only) the legacy `secret` parameter from mails sent before this change.
 */
export function isAuthorizedAdminAction(
	action: AdminAction,
	id: string,
	url: URL,
	cookies: Cookies
): boolean {
	const token = url.searchParams.get('token');
	if (id && token && safeEqual(token, adminActionToken(action, id))) return true;
	if (isAdmin(cookies)) return true;
	const legacySecret = url.searchParams.get('secret');
	return !!env.ADMIN_SECRET && !!legacySecret && safeEqual(legacySecret, env.ADMIN_SECRET);
}
