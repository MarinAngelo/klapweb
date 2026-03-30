import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';
import { isBooked, isCancelled } from '$lib/server/bookings';
import { expandDoc } from '$lib/server/terminSlots';

export type { TerminSlot as AvailableTermin } from '$lib/server/terminSlots';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const client = createClient({ fetch });
		const docs = await client.getAllByType('terminplanung');
		const today = new Date().toISOString().slice(0, 10);

		const allSlots = docs.flatMap((doc) => expandDoc(doc, today));

		const withAvailability = await Promise.all(
			allSlots.map(async (slot) => {
				const [booked, cancelled] = await Promise.all([isBooked(slot.id), isCancelled(slot.id)]);
				return booked || cancelled ? null : slot;
			})
		);

		const available = withAvailability.filter((t) => t !== null);
		available.sort((a, b) => {
			const aStr = a!.datum + 'T' + (a!.uhrzeit || '00:00');
			const bStr = b!.datum + 'T' + (b!.uhrzeit || '00:00');
			return aStr.localeCompare(bStr);
		});

		return new Response(JSON.stringify(available), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		console.error('GET /api/termine Fehler:', e);
		return new Response(JSON.stringify([]), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
