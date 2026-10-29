import type { PageServerLoad, Actions } from './$types';
import { listEventRegistrations, deleteEventRegistration } from '$lib/server/eventRegistrations';
import { createClient } from '$lib/prismicio';

export const prerender = false;

export const load: PageServerLoad = async ({ fetch }) => {
	const registrations = await listEventRegistrations().catch(() => []);

	// Event-Daten (start_date) für alle vorkommenden UIDs laden
	const uids = [...new Set(registrations.map((r) => r.eventUid))];
	const eventDates: Record<string, { start: string | null; end: string | null }> = {};
	if (uids.length > 0) {
		const client = createClient({ fetch });
		await Promise.all(
			uids.map(async (uid) => {
				try {
					const doc = await client.getByUID('event', uid);
					const d = doc.data as Record<string, unknown>;
					eventDates[uid] = {
						start: (d.start_date as string | null) ?? null,
						end: (d.end_date as string | null) ?? null
					};
				} catch {
					eventDates[uid] = { start: null, end: null };
				}
			})
		);
	}

	return { registrations, eventDates };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		if (id) await deleteEventRegistration(id);
		return { ok: true };
	},

	deleteAll: async () => {
		const all = await listEventRegistrations();
		await Promise.all(all.map((r) => deleteEventRegistration(r.id)));
		return { ok: true };
	}
};
