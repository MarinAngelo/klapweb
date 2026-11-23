import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { isMonat } from '$lib/assistenz';
import { FEATURE_ASSISTENZ } from '$lib/server/features';
import { loadConfig, loadMonat, saveMonatAusFormular } from '$lib/server/assistenz';

export const prerender = false;

// Access: /admin/* is protected centrally in hooks.server.ts (admin session)
export const load: PageServerLoad = async ({ params }) => {
	if (!FEATURE_ASSISTENZ || !isMonat(params.monat)) throw error(404, 'Nicht gefunden');
	const [config, daten] = await Promise.all([loadConfig(), loadMonat(params.monat)]);
	return { monat: params.monat, config, daten };
};

export const actions: Actions = {
	save: async ({ params, request }) => {
		if (!FEATURE_ASSISTENZ || !isMonat(params.monat)) throw error(404, 'Nicht gefunden');
		const form = Object.fromEntries(await request.formData());
		const err = await saveMonatAusFormular(params.monat, form);
		if (err) return fail(400, { error: err });
		return { saved: true };
	}
};
