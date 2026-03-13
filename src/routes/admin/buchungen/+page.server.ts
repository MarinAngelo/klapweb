import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { listBookings, deleteBooking } from '$lib/server/bookings';
import { expandDoc } from '$lib/server/terminSlots';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url, fetch }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

	const today = new Date().toISOString().slice(0, 10);

	const [bookingsResult, slotsResult] = await Promise.allSettled([
		listBookings(),
		(async () => {
			const client = createClient({ fetch });
			const docs = await client.getAllByType('terminplanung');
			return docs.flatMap((doc) => expandDoc(doc, today));
		})()
	]);

	const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value : [];
	const blobError = bookingsResult.status === 'rejected'
		? String((bookingsResult as PromiseRejectedResult).reason)
		: null;

	const allSlots = slotsResult.status === 'fulfilled' ? slotsResult.value : [];
	const bookedIds = new Set(bookings.map((b) => b.terminId));

	const freeSlots = allSlots
		.filter((s) => !bookedIds.has(s.id))
		.sort((a, b) => (a.datum + a.uhrzeit).localeCompare(b.datum + b.uhrzeit));

	return { bookings, freeSlots, blobError };
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
