import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listCustomers } from '$lib/server/customers';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');

	if (!secret || provided !== secret) {
		throw error(403, 'Kein Zugriff');
	}

	let customers: Awaited<ReturnType<typeof listCustomers>> = [];
	try {
		customers = await listCustomers();
	} catch (e) {
		console.error('listCustomers fehlgeschlagen:', e);
	}
	return { customers };
};
