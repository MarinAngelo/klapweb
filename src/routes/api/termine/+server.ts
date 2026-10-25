import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';
import { listBookings, listCancelled } from '$lib/server/bookings';
import { expandArbeitstag } from '$lib/server/terminSlots';
import { getCachedTermine, setCachedTermine } from '$lib/server/termineCache';

export type { TerminSlot as AvailableTermin } from '$lib/server/terminSlots';

function toMinutes(value: string): number | null {
	const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? '');
	if (!match) return null;
	return Number(match[1]) * 60 + Number(match[2]);
}

export const GET: RequestHandler = async () => {
	const cached = getCachedTermine();
	if (cached) {
		return new Response(JSON.stringify(cached), {
			headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
		});
	}

	try {
		const client = createClient();
		const dynamicClient = client as any;
		const [workdays, offers] = await Promise.all([
			dynamicClient.getAllByType('arbeitstag').catch(() => []),
			dynamicClient.getAllByType('angebot').catch(() => [])
		]);
		const today = new Date().toISOString().slice(0, 10);

		const allSlots = workdays.flatMap((doc) => expandArbeitstag(doc, offers, today));

		// Buchungen und Sperrungen einmalig laden statt pro Slot einzeln
		let bookedIds = new Set<string>();
		let cancelledIds = new Set<string>();
		let bookings: Awaited<ReturnType<typeof listBookings>> = [];
		try {
			[bookings, cancelledIds] = await Promise.all([
				listBookings(),
				listCancelled().then((ids) => new Set(ids))
			]);
			bookedIds = new Set(bookings.map((b) => b.terminId));
		} catch {
			// Blobs nicht erreichbar → alle Slots als verfügbar behandeln
		}

		const now = Date.now();
		const available = allSlots.filter((slot) => {
			if (bookedIds.has(slot.id)) return false;
			if (cancelledIds.has(slot.id)) return false;
			// Vergangen inkl. Vorlaufzeit: ab Startzeit minus Vorlaufzeit nicht mehr buchbar
			if (slot.datum && slot.uhrzeit) {
				const vorlaufMs = (slot.vorlaufzeit ?? 0) * 60000;
				if (new Date(`${slot.datum}T${slot.uhrzeit}:00`).getTime() - vorlaufMs < now) return false;
			}
			if (slot.endzeit) {
				const start = toMinutes(slot.uhrzeit);
				const end = toMinutes(slot.endzeit);
				if (start !== null && end !== null) {
					const overlap = bookings.some((booking) => {
						if (booking.terminId === slot.id || booking.datum !== slot.datum) return false;
						const existingStart = toMinutes(booking.uhrzeit);
						const existingEnd = toMinutes(booking.endzeit ?? booking.uhrzeit);
						if (existingStart === null || existingEnd === null) return false;
						return start < existingEnd && end > existingStart;
					});
					if (overlap) return false;
				}
			}
			return true;
		});

		available.sort((a, b) => {
			const aStr = a.datum + 'T' + (a.uhrzeit || '00:00');
			const bStr = b.datum + 'T' + (b.uhrzeit || '00:00');
			return aStr.localeCompare(bStr);
		});

		setCachedTermine(available);

		return new Response(JSON.stringify(available), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		console.error('GET /api/termine Fehler:', e);
		const detail = e instanceof Error ? e.message : String(e);
		return new Response(JSON.stringify({ error: 'Termine konnten nicht geladen werden', detail }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
