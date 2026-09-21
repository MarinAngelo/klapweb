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
import { invalidateTermineCache } from '$lib/server/termineCache';
import { createClient } from '$lib/prismicio';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url, fetch }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

	const today = new Date().toISOString().slice(0, 10);
	const allSlotsFrom = '2000-01-01'; // Admin sieht alle Termine, auch vergangene

	const [bookingsResult, slotsResult, cancelledResult] = await Promise.allSettled([
		listBookings(),
		(async () => {
			const client = createClient({ fetch });
			const dynamicClient = client as any;
			const [workdays, offers] = await Promise.all([
				dynamicClient.getAllByType('arbeitstag').catch(() => []),
				dynamicClient.getAllByType('angebot').catch(() => [])
			]);

			// Orte laden und den Slots zuordnen
			const orte = await dynamicClient.getAllByType('ort').catch(() => []);
			const ortByUid = new Map(orte.map((o: any) => [o.uid, o]));

			const slots = workdays.flatMap((doc: any) => expandArbeitstag(doc, offers, allSlotsFrom));
			return slots.map((slot) => {
				const offerDoc = offers.find((o: any) => o.uid === slot.angebotId);
				const ortLink = (offerDoc?.data as any)?.ort;
				const ortDoc = ortLink?.uid ? ortByUid.get(ortLink.uid) : null;
				return { ...slot, ortName: ortDoc ? ((ortDoc.data as any).name ?? '') : '' };
			});
		})(),
		listCancelled()
	]);

	const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value : [];
	const blobError =
		bookingsResult.status === 'rejected'
			? String((bookingsResult as PromiseRejectedResult).reason)
			: null;

	const allSlots = slotsResult.status === 'fulfilled' ? slotsResult.value : [];
	const slotById = new Map(allSlots.map((s: any) => [s.id, s]));
	const bookingsWithOrt = bookings.map((b) => ({
		...b,
		ortName: (slotById.get(b.terminId) as any)?.ortName ?? ''
	}));
	const cancelledIds = new Set(cancelledResult.status === 'fulfilled' ? cancelledResult.value : []);
	const bookedIds = new Set(bookings.map((b) => b.terminId));

	const now = Date.now();

	const candidateFreeSlots = allSlots.filter(
		(s) => !bookedIds.has(s.id) && !cancelledIds.has(s.id)
	);
	const freeSlotChecks = await Promise.all(
		candidateFreeSlots.map(async (s) => {
			const vorlaufMs = (s.vorlaufzeit ?? 0) * 60000;
			const startTime =
				s.datum && s.uhrzeit ? new Date(`${s.datum}T${s.uhrzeit}:00`).getTime() : null;
			return {
				slot: s,
				blocked: !!s.endzeit && (await hasOverlappingBooking(s.datum, s.uhrzeit, s.endzeit, s.id)),
				past: startTime !== null ? startTime - vorlaufMs < now : s.datum < today
			};
		})
	);
	const freeSlots = freeSlotChecks
		.filter(({ blocked, past }) => !blocked && !past)
		.map(({ slot }) => slot)
		.sort((a, b) => (a.datum + a.uhrzeit).localeCompare(b.datum + b.uhrzeit));

	const pastSlots = freeSlotChecks
		.filter(({ blocked, past }) => !blocked && past)
		.map(({ slot }) => slot)
		.sort((a, b) => (a.datum + a.uhrzeit).localeCompare(b.datum + b.uhrzeit));

	const cancelledSlots = allSlots
		.filter((s) => cancelledIds.has(s.id))
		.sort((a, b) => (a.datum + a.uhrzeit).localeCompare(b.datum + b.uhrzeit));

	return { bookings: bookingsWithOrt, freeSlots, pastSlots, cancelledSlots, blobError };
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
			invalidateTermineCache();
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
			invalidateTermineCache();
		}
	},

	cancelSelected: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const ids = form.getAll('slotId').filter((id): id is string => typeof id === 'string' && !!id);
		await Promise.all(ids.map(cancelSlot));
		invalidateTermineCache();
	},

	uncancel: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await uncancelSlot(id);
			invalidateTermineCache();
		}
	},

	deleteAll: async ({ url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
		const all = await listBookings();
		await Promise.all(all.map((b) => deleteBooking(b.terminId)));
		invalidateTermineCache();
		return { ok: true };
	}
};
