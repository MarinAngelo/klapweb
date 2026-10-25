import { redirect, fail } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';
import { grantPageAccess, isValidPagePassword, safeRedirectPath } from '$lib/server/pageAuth';
import type { Actions } from './$types';

export const prerender = false;

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const data = await request.formData();
		const password = data.get('password') as string;
		const redirectTo = safeRedirectPath(data.get('redirect') as string);

		const client = createClient({ fetch });
		const settings = await client.getSingle('settings', { lang: '*' }).catch(() => null);
		const pagePassword = (settings?.data as any)?.page_password as string | null;

		if (!pagePassword || !isValidPagePassword(password, pagePassword)) {
			return fail(403, { error: 'Falsches Passwort', redirect: redirectTo });
		}

		// Signed cookie — the password itself is never stored in the browser
		grantPageAccess(cookies, pagePassword);

		throw redirect(303, redirectTo);
	}
};
