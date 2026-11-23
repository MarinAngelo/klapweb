import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { isMonat } from '$lib/assistenz';
import {
	addPerson,
	deletePerson,
	deleteSaetze,
	isValidPersonId,
	loadConfig,
	movePerson,
	saveSaetze,
	setJahresbeginn,
	updatePerson
} from '$lib/server/assistenz';

export const prerender = false;

// Access: /admin/* is protected centrally in hooks.server.ts (admin session)
export const load: PageServerLoad = async () => ({ config: await loadConfig() });

const done = (err: string | null, ok: Record<string, unknown>) =>
	err ? fail(400, { error: err }) : ok;

export const actions: Actions = {
	addPerson: async ({ request }) =>
		done(await addPerson(Object.fromEntries(await request.formData())), { saved: 'person' }),

	updatePerson: async ({ request }) => {
		const form = Object.fromEntries(await request.formData());
		if (!isValidPersonId(form.id)) return fail(400, { error: 'Person nicht gefunden.' });
		return done(await updatePerson(form.id, form), { saved: 'person', id: form.id });
	},

	movePerson: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id');
		if (!isValidPersonId(id)) return fail(400, { error: 'Person nicht gefunden.' });
		await movePerson(id, form.get('richtung') === 'up' ? -1 : 1);
		return { moved: id };
	},

	deletePerson: async ({ request }) => {
		const id = (await request.formData()).get('id');
		if (!isValidPersonId(id)) return fail(400, { error: 'Person nicht gefunden.' });
		return done(await deletePerson(id), { deleted: 'person' });
	},

	saveSaetze: async ({ request }) =>
		done(await saveSaetze(await request.formData()), { saved: 'saetze' }),

	deleteSaetze: async ({ request }) => {
		const gueltigAb = (await request.formData()).get('gueltigAb');
		if (!isMonat(gueltigAb)) return fail(400, { error: 'Ungültiger Monat.' });
		await deleteSaetze(gueltigAb);
		return { deleted: 'saetze' };
	},

	jahresbeginn: async ({ request }) =>
		done(await setJahresbeginn((await request.formData()).get('jahresbeginn')), {
			saved: 'jahresbeginn'
		})
};
