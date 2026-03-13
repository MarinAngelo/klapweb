import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { listBookings, deleteBooking } from '$lib/server/bookings';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');

	if (!secret || provided !== secret) {
		throw error(403, 'Kein Zugriff');
	}

	let bookings: Awaited<ReturnType<typeof listBookings>> = [];
	let blobError: string | null = null;
	try {
		bookings = await listBookings();
	} catch (e) {
		blobError = e instanceof Error ? e.message : String(e);
		console.error('listBookings fehlgeschlagen:', e);
	}
	return { bookings, blobError };
};

export const actions: Actions = {
	delete: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await deleteBooking(id);
		}
	}
};
