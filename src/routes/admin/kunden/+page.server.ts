import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { listCustomers, deleteCustomer } from '$lib/server/customers';
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
	delete: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await deleteCustomer(id);
		}
	}
};
