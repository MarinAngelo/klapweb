import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { FEATURE_STUNDENABRECHNUNG } from '$lib/server/features';
import {
	deleteStunden,
	isValidStundenId,
	listStunden,
	parseStundenInput,
	updateStunden
} from '$lib/server/stunden';

export const prerender = false;

// Zugriff: /admin/* ist zentral in hooks.server.ts geschützt (Admin-Session)
export const load: PageServerLoad = async () => {
	if (!FEATURE_STUNDENABRECHNUNG) throw error(404, 'Nicht gefunden');
	try {
		return { entries: await listStunden(), loadError: null };
	} catch (e) {
		console.error('[admin/stunden] Laden fehlgeschlagen:', e);
		return { entries: [], loadError: e instanceof Error ? e.message : String(e) };
	}
};

export const actions: Actions = {
	update: async ({ request }) => {
		if (!FEATURE_STUNDENABRECHNUNG) throw error(404, 'Nicht gefunden');
		const form = Object.fromEntries(await request.formData());
		if (!isValidStundenId(form.id)) return fail(400, { error: 'Ungültiger Eintrag' });
		const input = parseStundenInput(form);
		if ('error' in input) return fail(400, { error: input.error, id: form.id });
		if (!(await updateStunden(form.id, input)))
			return fail(404, { error: 'Eintrag nicht gefunden' });
		return { saved: form.id };
	},

	delete: async ({ request }) => {
		if (!FEATURE_STUNDENABRECHNUNG) throw error(404, 'Nicht gefunden');
		const id = (await request.formData()).get('id');
		if (!isValidStundenId(id)) return fail(400, { error: 'Ungültiger Eintrag' });
		await deleteStunden(id);
		return { deleted: id };
	}
};
