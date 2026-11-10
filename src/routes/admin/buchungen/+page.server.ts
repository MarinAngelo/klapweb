import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { SITE_TIME_ZONE, zonedTimeToUtc } from '$lib/utils/formatDate';
import {
	listBookings,
	deleteBooking,
	cancelSlot,
	uncancelSlot,
	listCancelled,
	overlapsBooking
} from '$lib/server/bookings';
import { expandArbeitstag } from '$lib/server/terminSlots';
import { diagnoseArbeitstag } from '$lib/terminDiagnose.js';
import { invalidateTermineCache } from '$lib/server/termineCache';
import { sendDueBookingInvoices } from '$lib/server/bookingInvoices';
import { createClient } from '$lib/prismicio';

export const prerender = false;

export const load: PageServerLoad = async ({ fetch }) => {
	// Due invoices of past appointments (same job as the hourly Netlify function)
	await sendDueBookingInvoices().catch((e) => console.error('Termin-Rechnungen:', e));
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
			const withOrt = slots.map((slot) => {
				const offerDoc = offers.find((o: any) => o.uid === slot.angebotId);
				const ortLink = (offerDoc?.data as any)?.ort;
				const ortDoc = ortLink?.uid ? ortByUid.get(ortLink.uid) : null;
				return { ...slot, ortName: ortDoc ? ((ortDoc.data as any).name ?? '') : '' };
			});
			// Sources too: no free slots → explain why (per working day)
			return { slots: withOrt, workdays: workdays as any[], offers: offers as any[] };
		})(),
		listCancelled()
	]);

	const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value : [];
	const blobError =
		bookingsResult.status === 'rejected'
			? String((bookingsResult as PromiseRejectedResult).reason)
			: null;

	const allSlots = slotsResult.status === 'fulfilled' ? slotsResult.value.slots : [];
	const slotSources = slotsResult.status === 'fulfilled' ? slotsResult.value : null;
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
			// Local time of the working day (not the server's, UTC on Netlify)
			const startTime =
				s.datum && s.uhrzeit
					? zonedTimeToUtc(s.datum, s.uhrzeit, s.zeitzone || SITE_TIME_ZONE)
					: null;
			return {
				slot: s,
				blocked:
					!!s.endzeit &&
					// Bookings are loaded once above (one Blob request per slot overloaded Netlify)
					overlapsBooking(bookings, s.datum, s.uhrzeit, s.blockedUntil ?? s.endzeit, s.id),
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

	// Hints when there are no free slots: what is missing in Prismic
	let freeSlotHints: {
		label: string;
		problems: { key: string; params?: Record<string, string | number> }[];
	}[] = [];
	if (freeSlots.length === 0 && slotSources) {
		const { workdays, offers } = slotSources;
		freeSlotHints =
			workdays.length === 0
				? [{ label: '', problems: [{ key: 'Kein «Arbeitstag» veröffentlicht' }] }]
				: workdays
						.map((doc: any) => ({
							label: doc.data?.bezeichnung || doc.uid,
							problems: diagnoseArbeitstag(doc, offers, today)
						}))
						.filter((h) => h.problems.length > 0);
	}

	return {
		bookings: bookingsWithOrt,
		freeSlots,
		pastSlots,
		cancelledSlots,
		freeSlotHints,
		blobError
	};
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await deleteBooking(id);
			invalidateTermineCache();
		}
	},

	cancel: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await cancelSlot(id);
			invalidateTermineCache();
		}
	},

	cancelSelected: async ({ request }) => {
		const form = await request.formData();
		const ids = form.getAll('slotId').filter((id): id is string => typeof id === 'string' && !!id);
		await Promise.all(ids.map(cancelSlot));
		invalidateTermineCache();
	},

	uncancel: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await uncancelSlot(id);
			invalidateTermineCache();
		}
	},

	// Operator books for a customer who cannot book online → same logic as the website
	// (/api/buche-termin: conflicts, buffer, customer), stored with source 'admin'
	bookForCustomer: async ({ request, fetch }) => {
		const form = await request.formData();
		const value = (key: string) => String(form.get(key) ?? '').trim();
		const terminId = value('id');
		const name = value('name');
		const email = value('email');
		if (!terminId) return fail(400, { bookError: 'Termin fehlt' });
		if (!name) return fail(400, { bookError: 'Name fehlt', bookId: terminId });
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { bookError: 'E-Mail ist ungültig', bookId: terminId });
		}
		// Server-side fetch to the own endpoint forwards the admin session cookie
		const response = await fetch('/api/buche-termin', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				terminId,
				name,
				email: email || undefined,
				telefon: value('telefon') || undefined,
				byAdmin: true,
				sendConfirmation: form.get('sendConfirmation') === 'on'
			})
		});
		if (!response.ok) {
			const result = await response.json().catch(() => ({}));
			return fail(response.status, {
				bookError: result.error || 'Buchung fehlgeschlagen',
				bookId: terminId
			});
		}
		return { booked: name };
	},

	deleteAll: async () => {
		const all = await listBookings();
		await Promise.all(all.map((b) => deleteBooking(b.terminId)));
		invalidateTermineCache();
		return { ok: true };
	}
};
