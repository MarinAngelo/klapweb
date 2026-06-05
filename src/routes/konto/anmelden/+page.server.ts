import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { verifyPassword } from '$lib/server/users';
import { createSession } from '$lib/server/sessions';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
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

		const token = await createSession(user.id, user.email, user.name);

		cookies.set('klap_user_session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(303, '/konto');
	}
};
