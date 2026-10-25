import { fail, redirect } from '@sveltejs/kit';
import {
	endAdminSession,
	isAdmin,
	isValidAdminPassword,
	startAdminSession
} from '$lib/server/adminAuth';

export const prerender = false;

// Only redirect inside the admin panel (no open redirect via ?next=)
function safeNext(next: string | null): string {
	return next && next.startsWith('/admin/') && !next.startsWith('//') ? next : '/admin/dashboard';
}

export function load({ cookies, url }) {
	if (isAdmin(cookies)) throw redirect(303, safeNext(url.searchParams.get('next')));
	return { no_index: true };
}

export const actions = {
	login: async ({ request, cookies, url }) => {
		const form = await request.formData();
		if (!isValidAdminPassword(String(form.get('password') ?? ''))) {
			return fail(401, { error: 'Falsches Passwort.' });
		}
		startAdminSession(cookies);
		throw redirect(303, safeNext(url.searchParams.get('next')));
	},

	logout: async ({ cookies }) => {
		endAdminSession(cookies);
		throw redirect(303, '/admin');
	}
};
