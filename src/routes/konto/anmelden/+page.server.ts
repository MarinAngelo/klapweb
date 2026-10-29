import { fail, redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { verifyPassword } from '$lib/server/users';
import { createSession } from '$lib/server/sessions';
import { FEATURE_KUNDENKONTO } from '$lib/server/features';
import { REMEMBER_DAYS, REMEMBER_SECONDS, wantsRemember } from '$lib/auth/remember';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!FEATURE_KUNDENKONTO) throw error(404, 'Funktion nicht verfügbar');
	if (locals.user) throw redirect(303, '/konto');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const password = data.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'E-Mail und Passwort erforderlich' });
		}

		const user = await verifyPassword(email, password).catch(() => null);

		if (!user) {
			return fail(403, { error: 'E-Mail oder Passwort ungültig' });
		}

		// "Angemeldet bleiben": REMEMBER_DAYS; otherwise browser-session cookie (server: max. 1 day)
		const remember = wantsRemember(data);
		const token = await createSession(user.id, user.email, user.name, remember ? REMEMBER_DAYS : 1);

		cookies.set('klap_user_session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			...(remember ? { maxAge: REMEMBER_SECONDS } : {})
		});

		throw redirect(303, '/konto');
	}
};
