/**
 * Agency area (/agency/*): login with AGENCY_SECRET → signed cookie (1 h, with
 * "Angemeldet bleiben" REMEMBER_DAYS). Shared by all agency pages.
 */
import { fail, redirect, type Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { createHmac, timingSafeEqual } from 'crypto';
import { REMEMBER_SECONDS, wantsRemember } from '$lib/auth/remember';

export const AGENCY_COOKIE = 'agency_auth';
const AUTH_MAX_AGE_SECONDS = 60 * 60;

// Cookie format: "<exp>.<hmac-sha256(exp, AGENCY_SECRET)>" — unforgeable without the secret
function sign(value: string, secret: string): string {
	return createHmac('sha256', secret).update(value).digest('base64url');
}

function createAuthCookie(secret: string, maxAgeSeconds: number): string {
	const exp = String(Date.now() + maxAgeSeconds * 1000);
	return `${exp}.${sign(exp, secret)}`;
}

export function isAgencyAuthenticated(cookies: Cookies): boolean {
	const cookie = cookies.get(AGENCY_COOKIE);
	const secret = env.AGENCY_SECRET;
	if (!cookie || !secret) return false;
	const [exp, signature] = cookie.split('.');
	if (!exp || !signature) return false;
	const expected = Buffer.from(sign(exp, secret));
	const actual = Buffer.from(signature);
	if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
	return Number(exp) > Date.now();
}

/** Form action: login → redirect to `target` */
export async function agencyLogin(request: Request, cookies: Cookies, target: string) {
	const data = await request.formData();
	const secret = data.get('secret') as string;

	const expectedSecret = env.AGENCY_SECRET;
	// Compare fixed-length hashes in constant time
	const matches =
		!!expectedSecret &&
		timingSafeEqual(
			createHmac('sha256', 'agency-login')
				.update(secret ?? '')
				.digest(),
			createHmac('sha256', 'agency-login').update(expectedSecret).digest()
		);
	if (!matches) return fail(401, { error: 'Falsches Passwort' });

	const maxAge = wantsRemember(data) ? REMEMBER_SECONDS : AUTH_MAX_AGE_SECONDS;
	cookies.set(AGENCY_COOKIE, createAuthCookie(expectedSecret, maxAge), {
		httpOnly: true,
		secure: !dev, // Lokal http://localhost erlauben
		sameSite: 'strict',
		maxAge,
		path: '/'
	});
	throw redirect(303, target);
}

/** Form action: logout → redirect to `target` */
export function agencyLogout(cookies: Cookies, target: string): never {
	cookies.delete(AGENCY_COOKIE, { path: '/' });
	throw redirect(303, target);
}
