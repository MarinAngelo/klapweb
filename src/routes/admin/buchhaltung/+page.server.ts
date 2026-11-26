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
	parseBuchung,
	updateBuchung
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

	/** Bulk actions (AdminBulkActions): action + ids (JSON), only manual entries */
	bulk: async ({ request }) => {
		if (!FEATURE_BUCHHALTUNG) throw error(404, 'Nicht gefunden');
		const form = await request.formData();
		let ids: unknown[] = [];
		try {
			ids = JSON.parse(String(form.get('ids') ?? '[]'));
		} catch {
			return fail(400, { error: 'Ungültige Auswahl' });
		}
		const valid = Array.isArray(ids) ? ids.filter(isValidBuchungId) : [];
		if (!valid.length) return fail(400, { error: 'Keine Einträge ausgewählt' });
		switch (form.get('action')) {
			case 'delete':
				await Promise.all(valid.map((id) => deleteBuchung(id)));
				return { deleted: valid.length };
			default:
				return fail(400, { error: 'Unbekannte Aktion' });
		}
	},

	update: async ({ request }) => {
		if (!FEATURE_BUCHHALTUNG) throw error(404, 'Nicht gefunden');
		const form = await request.formData();
		const id = form.get('id');
		if (!isValidBuchungId(id)) return fail(400, { error: 'Ungültiger Eintrag' });
		const data = parseBuchung(form);
		if ('error' in data) return fail(400, { error: data.error });
		const file = form.get('beleg');
		const beleg = file instanceof File ? file : null;
		const fileError = belegError(beleg);
		if (fileError) return fail(400, { error: fileError });
		const updated = await updateBuchung(id, data, beleg, form.get('beleg-entfernen') === 'on');
		if (!updated) return fail(404, { error: 'Eintrag nicht gefunden' });
		return { updated: id };
	}
};
