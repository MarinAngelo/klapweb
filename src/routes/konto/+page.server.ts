import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listBookingsByEmail } from '$lib/server/bookings';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/konto/anmelden');

	let bookings: Awaited<ReturnType<typeof listBookingsByEmail>> = [];
	try {
		bookings = await listBookingsByEmail(locals.user.email);
	} catch {
		// Blobs nicht verfügbar
	}

	return {
		user: locals.user,
		bookings
	};
};
