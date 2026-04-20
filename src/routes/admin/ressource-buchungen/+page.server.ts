import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { listAlleRessourceBuchungen, deleteRessourceBuchung } from '$lib/server/ressourceBuchungen';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

	let buchungen: Awaited<ReturnType<typeof listAlleRessourceBuchungen>> = [];
	let blobError: string | null = null;

	try {
		buchungen = await listAlleRessourceBuchungen();
	} catch (e) {
		blobError = String(e);
	}

	return { buchungen, blobError };
};

export const actions: Actions = {
	delete: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await deleteRessourceBuchung(id);
		}
	}
};
