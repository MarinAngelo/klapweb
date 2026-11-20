import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { FEATURE_STUNDENABRECHNUNG } from '$lib/server/features';
import {
	abrechnen,
	abrechnungZuruecksetzen,
	deleteStunden,
	getStunden,
	isAbgerechnet,
	isValidAbrechnungId,
	isValidStundenId,
	listStunden,
	parseStundenInput,
	updateStunden
} from '$lib/server/stunden';

export const prerender = false;

const BILLED_LOCKED =
	'Abgerechnete Einträge können nicht geändert werden — zuerst die Abrechnung zurücksetzen.';

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
	/** Bills all open entries of one person */
	abrechnen: async ({ request }) => {
		if (!FEATURE_STUNDENABRECHNUNG) throw error(404, 'Nicht gefunden');
		const name = String((await request.formData()).get('name') ?? '');
		const { count } = await abrechnen(name);
		return { billed: count };
	},

	zuruecksetzen: async ({ request }) => {
		if (!FEATURE_STUNDENABRECHNUNG) throw error(404, 'Nicht gefunden');
		const id = (await request.formData()).get('abrechnung');
		if (!isValidAbrechnungId(id)) return fail(400, { error: 'Ungültige Abrechnung' });
		await abrechnungZuruecksetzen(id);
		return { reset: id };
	},

	update: async ({ request }) => {
		if (!FEATURE_STUNDENABRECHNUNG) throw error(404, 'Nicht gefunden');
		const form = Object.fromEntries(await request.formData());
		if (!isValidStundenId(form.id)) return fail(400, { error: 'Ungültiger Eintrag' });
		const existing = await getStunden(form.id);
		if (existing && isAbgerechnet(existing)) return fail(400, { error: BILLED_LOCKED });
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
		const existing = await getStunden(id);
		if (existing && isAbgerechnet(existing)) return fail(400, { error: BILLED_LOCKED });
		await deleteStunden(id);
		return { deleted: id };
	}
};
