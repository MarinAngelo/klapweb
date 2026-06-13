import { redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteSession } from '$lib/server/sessions';
import { isFeatureActive } from '$lib/server/features';

export const prerender = false;

export const load: PageServerLoad = async () => {
	if (!isFeatureActive('terminbuchung')) throw error(404, 'Funktion nicht verfügbar');
	throw redirect(303, '/konto');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		const token = cookies.get('klap_user_session');
		if (token) {
			await deleteSession(token).catch(() => {});
			cookies.delete('klap_user_session', { path: '/' });
		}
		throw redirect(303, '/konto/anmelden');
	}
};
