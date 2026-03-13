import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';
import { isBooked } from '$lib/server/bookings';

export interface AvailableTermin {
	id: string;
	titel: string;
	datum: string;
	uhrzeit: string;
	sessionLaenge: number | null;
	zeitzone: string;
	label: string;
}

function makeLabel(datum: string, uhrzeit: string, titel: string, sessionLaenge: number | null): string {
	if (!datum) return titel;
	const date = new Date(datum + 'T12:00:00Z');
	const formatted = date.toLocaleDateString('de-CH', {
		weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
	});
	let label = formatted;
	if (uhrzeit) label += `, ${uhrzeit}`;
	if (titel) label += ` – ${titel}`;
	if (sessionLaenge) label += ` (${sessionLaenge} min)`;
	return label;
}

function advanceDate(date: Date, wiederholung: string): Date {
	const next = new Date(date);
	if (wiederholung === 'Täglich') next.setUTCDate(next.getUTCDate() + 1);
	else if (wiederholung === 'Wöchentlich') next.setUTCDate(next.getUTCDate() + 7);
	else if (wiederholung === 'Zweiwöchentlich') next.setUTCDate(next.getUTCDate() + 14);
	else if (wiederholung === 'Monatlich') next.setUTCMonth(next.getUTCMonth() + 1);
	return next;
}

/** Expands a terminplanung doc into individual bookable slot IDs + dates. */
function expandOccurrences(doc: any, today: string): Array<{ id: string; datum: string }> {
	const d = doc.data as any;
	const startDatum: string = d.datum ?? '';
	if (!startDatum) return [];

	const wiederholung: string = d.wiederholung ?? 'Keine';
	if (!wiederholung || wiederholung === 'Keine') {
		// Single slot — only if not in the past
		if (startDatum < today) return [];
		return [{ id: doc.uid, datum: startDatum }];
	}

	const bis: string | null = d.wiederholung_bis ?? null;
	const anzahl: number | null = d.wiederholung_anzahl ?? null;

	const slots: Array<{ id: string; datum: string }> = [];
	let current = new Date(startDatum + 'T12:00:00Z');
	let totalCount = 0;
	const hardLimit = 500; // safety cap

	while (totalCount < hardLimit) {
		const dateStr = current.toISOString().slice(0, 10);

		// Stop if past end date
		if (bis && dateStr > bis) break;
		// Stop if reached count limit
		if (anzahl !== null && totalCount >= anzahl) break;

		// Only include future slots; still count past ones toward anzahl
		if (dateStr >= today) {
			slots.push({ id: `${doc.uid}_${dateStr}`, datum: dateStr });
		}

		totalCount++;
		current = advanceDate(current, wiederholung);
	}

	return slots;
}

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const client = createClient({ fetch });
		const docs = await client.getAllByType('terminplanung');
		const today = new Date().toISOString().slice(0, 10);

		// Expand all docs into individual slots, then check availability in parallel
		const allSlots = docs.flatMap((doc) => {
			const d = doc.data as any;
			const uhrzeit: string = d.uhrzeit ?? '';
			const titel: string = d.titel ?? doc.uid;
			const sessionLaenge: number | null = d.session_laenge ?? null;
			const zeitzone: string = d.zeitzone ?? 'Europe/Zurich';

			return expandOccurrences(doc, today).map(({ id, datum }) => ({
				id, datum, uhrzeit, titel, sessionLaenge, zeitzone
			}));
		});

		const withAvailability = await Promise.all(
			allSlots.map(async (slot) => {
				const booked = await isBooked(slot.id);
				if (booked) return null;
				return {
					...slot,
					label: makeLabel(slot.datum, slot.uhrzeit, slot.titel, slot.sessionLaenge)
				} satisfies AvailableTermin;
			})
		);

		const available = withAvailability.filter((t): t is AvailableTermin => t !== null);

		available.sort((a, b) => {
			const aStr = a.datum + 'T' + (a.uhrzeit || '00:00');
			const bStr = b.datum + 'T' + (b.uhrzeit || '00:00');
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
