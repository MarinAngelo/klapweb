import { redirect, fail } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';
import type { Actions } from './$types';

export const prerender = false;

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const data = await request.formData();
		const password = data.get('password') as string;
		const redirectTo = (data.get('redirect') as string) || '/';

		const client = createClient({ fetch });
		const settings = await client.getSingle('settings', { lang: '*' }).catch(() => null);
		const pagePassword = (settings?.data as any)?.page_password as string | null;

		console.log('[login] pagePassword from Prismic:', JSON.stringify(pagePassword));
		console.log('[login] provided password:', JSON.stringify(password));

		if (!pagePassword || password !== pagePassword) {
			return fail(403, { error: 'Falsches Passwort', redirect: redirectTo });
		}

		cookies.set('klap_auth', pagePassword, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 86400
		});

		throw redirect(303, redirectTo);
	}
};
