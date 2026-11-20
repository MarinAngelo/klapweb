import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';

export const prerender = false;

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const client = createClient({ fetch });
	const settings = await client.getSingle('settings', { lang: '*' }).catch(() => null);
	const pagePassword = (settings?.data as any)?.page_password as string | null;
	const authCookie = cookies.get('klap_auth');

	if (!pagePassword || authCookie !== pagePassword) {
		throw redirect(303, `/login?redirect=${encodeURIComponent('/doku')}`);
	}

	return {};
};
