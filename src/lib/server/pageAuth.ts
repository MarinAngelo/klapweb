/**
 * Passwortgeschützte Seiten (Settings → Seiten-Passwort).
 *
 * Das Cookie `klap_auth` enthält nicht mehr das Passwort selbst, sondern Ablaufzeit + Signatur.
 * Das Seiten-Passwort fliesst in die Signatur ein: Wird es in Prismic geändert,
 * sind alle bisherigen Freigaben ungültig.
 */
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Cookies } from '@sveltejs/kit';

export const PAGE_AUTH_COOKIE = 'klap_auth';
const MAX_AGE_SECONDS = 24 * 60 * 60;

function sign(exp: string, pagePassword: string): string {
	// Server secret as key (falls back to the page password if no admin secret is set)
	const key = `page-auth:${env.ADMIN_SECRET || pagePassword}`;
	return createHmac('sha256', key).update(`${exp}:${pagePassword}`).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Password check in constant time */
export function isValidPagePassword(
	input: string,
	pagePassword: string | null | undefined
): boolean {
	if (!pagePassword || !input) return false;
	const digest = (value: string) => createHmac('sha256', 'page-login').update(value).digest();
	return timingSafeEqual(digest(input), digest(pagePassword));
}

export function grantPageAccess(cookies: Cookies, pagePassword: string): void {
	const exp = String(Date.now() + MAX_AGE_SECONDS * 1000);
	cookies.set(PAGE_AUTH_COOKIE, `${exp}.${sign(exp, pagePassword)}`, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'strict',
		maxAge: MAX_AGE_SECONDS
	});
}

export function hasPageAccess(cookies: Cookies, pagePassword: string | null | undefined): boolean {
	const value = cookies.get(PAGE_AUTH_COOKIE);
	if (!value || !pagePassword) return false;
	const [exp, signature] = value.split('.');
	if (!exp || !signature || !safeEqual(signature, sign(exp, pagePassword))) return false;
	return Number(exp) > Date.now();
}

/** Only relative paths on this site (no open redirect via the login form) */
export function safeRedirectPath(target: string | null | undefined): string {
	return target && target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/\\')
		? target
		: '/';
}
