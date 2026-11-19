import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { FEATURE_BUCHHALTUNG } from '$lib/server/features';
import {
	belegError,
	createBuchung,
	deleteBuchung,
	isValidBuchungId,
	KATEGORIEN,
	listBuchungen,
	parseBuchung
} from '$lib/server/buchhaltung';

export const prerender = false;

// Zugriff: /admin/* ist zentral in hooks.server.ts geschützt (Admin-Session)
export const load: PageServerLoad = async ({ url }) => {
	if (!FEATURE_BUCHHALTUNG) throw error(404, 'Nicht gefunden');
	const currentYear = new Date().getFullYear();
	const year = Number(url.searchParams.get('jahr')) || currentYear;
	try {
		const all = await listBuchungen();
		const years = [...new Set([currentYear, ...all.map((b) => Number(b.datum.slice(0, 4)))])].sort(
			(a, b) => b - a
		);
		return {
			year,
			years,
			entries: all.filter((b) => b.datum.startsWith(String(year))),
			kategorien: KATEGORIEN,
			loadError: null
		};
	} catch (e) {
		console.error('[admin/buchhaltung] Laden fehlgeschlagen:', e);
		return {
			year,
			years: [currentYear],
			entries: [],
			kategorien: KATEGORIEN,
			loadError: e instanceof Error ? e.message : String(e)
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		if (!FEATURE_BUCHHALTUNG) throw error(404, 'Nicht gefunden');
		const form = await request.formData();
		const data = parseBuchung(form);
		if ('error' in data) return fail(400, { error: data.error });
		const file = form.get('beleg');
		const beleg = file instanceof File ? file : null;
		const fileError = belegError(beleg);
		if (fileError) return fail(400, { error: fileError });
		await createBuchung(data, beleg);
		return { created: true };
	},

	delete: async ({ request }) => {
		if (!FEATURE_BUCHHALTUNG) throw error(404, 'Nicht gefunden');
		const id = (await request.formData()).get('id');
		if (!isValidBuchungId(id)) return fail(400, { error: 'Ungültiger Eintrag' });
		await deleteBuchung(id);
		return { deleted: id };
	}
};
