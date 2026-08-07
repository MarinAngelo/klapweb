import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { listEventRegistrations, deleteEventRegistration } from '$lib/server/eventRegistrations';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url, fetch }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

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

	return { registrations, eventDates, secret: provided };
};

export const actions: Actions = {
	delete: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id') as string;
		if (id) await deleteEventRegistration(id);
		return { ok: true };
	},

	deleteAll: async ({ url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
		const all = await listEventRegistrations();
		await Promise.all(all.map((r) => deleteEventRegistration(r.id)));
		return { ok: true };
	}
};
