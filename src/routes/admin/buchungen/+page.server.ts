import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import {
	listBookings,
	deleteBooking,
	cancelSlot,
	uncancelSlot,
	listCancelled,
	hasOverlappingBooking
} from '$lib/server/bookings';
import { expandArbeitstag } from '$lib/server/terminSlots';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url, fetch }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

	const today = new Date().toISOString().slice(0, 10);

	const [bookingsResult, slotsResult, cancelledResult] = await Promise.allSettled([
		listBookings(),
		(async () => {
			const client = createClient({ fetch });
			const dynamicClient = client as any;
			const [workdays, offers] = await Promise.all([
				dynamicClient.getAllByType('arbeitstag').catch(() => []),
				dynamicClient.getAllByType('angebot').catch(() => [])
			]);
			return workdays.flatMap((doc: any) => expandArbeitstag(doc, offers, today));
		})(),
		listCancelled()
	]);

	const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value : [];
	const blobError =
		bookingsResult.status === 'rejected'
			? String((bookingsResult as PromiseRejectedResult).reason)
			: null;

	const allSlots = slotsResult.status === 'fulfilled' ? slotsResult.value : [];
	const cancelledIds = new Set(cancelledResult.status === 'fulfilled' ? cancelledResult.value : []);
	const bookedIds = new Set(bookings.map((b) => b.terminId));

	const candidateFreeSlots = allSlots.filter(
		(s) => !bookedIds.has(s.id) && !cancelledIds.has(s.id)
	);
	const freeSlotChecks = await Promise.all(
		candidateFreeSlots.map(async (s) => ({
			slot: s,
			blocked: !!s.endzeit && (await hasOverlappingBooking(s.datum, s.uhrzeit, s.endzeit, s.id))
		}))
	);
	const freeSlots = freeSlotChecks
		.filter(({ blocked }) => !blocked)
		.map(({ slot }) => slot)
		.sort((a, b) => (a.datum + a.uhrzeit).localeCompare(b.datum + b.uhrzeit));

	const cancelledSlots = allSlots
		.filter((s) => cancelledIds.has(s.id))
		.sort((a, b) => (a.datum + a.uhrzeit).localeCompare(b.datum + b.uhrzeit));

	return { bookings, freeSlots, cancelledSlots, blobError };
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
	},

	cancel: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await cancelSlot(id);
		}
	},

	uncancel: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await uncancelSlot(id);
		}
	},

	deleteAll: async ({ url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
		const all = await listBookings();
		await Promise.all(all.map((b) => deleteBooking(b.terminId)));
		return { ok: true };
	}
};
