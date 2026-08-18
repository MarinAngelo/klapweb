import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { listCustomers, deleteCustomer, saveCustomer } from '$lib/server/customers';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');

	if (!secret || provided !== secret) {
		throw error(403, 'Kein Zugriff');
	}

	let customers: Awaited<ReturnType<typeof listCustomers>> = [];
	let blobError: string | null = null;
	try {
		customers = await listCustomers();
	} catch (e) {
		blobError = e instanceof Error ? e.message : String(e);
		console.error('listCustomers fehlgeschlagen:', e);
	}
	return { customers, blobError };
};

export const actions: Actions = {
	create: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();

		try {
			await saveCustomer({
				date: new Date().toISOString(),
				paymentMethod: 'manuell',
				service: (form.get('service') as string) || 'Manuell erfasst',
				amount: null,
				currency: 'CHF',
				vorname: form.get('vorname') as string,
				nachname: form.get('nachname') as string,
				firma: (form.get('firma') as string) || undefined,
				email: (form.get('email') as string) || undefined,
				adresse: (form.get('adresse') as string) || undefined,
				plz: (form.get('plz') as string) || undefined,
				ort: (form.get('ort') as string) || undefined,
				land: (form.get('land') as string) || undefined
			});

			return { success: true };
		} catch (e) {
			console.error('Kunde erstellen fehlgeschlagen:', e);
			throw error(500, 'Kunde konnte nicht erstellt werden');
		}
	},

	delete: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await deleteCustomer(id);
		}
	},

	deleteAll: async ({ url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
		const all = await listCustomers();
		await Promise.all(all.map((c) => deleteCustomer(c.id)));
		return { ok: true };
	}
};
