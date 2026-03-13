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

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const client = createClient({ fetch });
		const docs = await client.getAllByType('terminplanung');

		const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

		// Filter: only future or today
		const upcoming = docs.filter((doc) => {
			const datum = (doc.data as any).datum as string | null;
			return datum && datum >= today;
		});

		// Check which are booked
		const withAvailability = await Promise.all(
			upcoming.map(async (doc) => {
				const booked = await isBooked(doc.uid);
				if (booked) return null;

				const d = doc.data as any;
				const datum: string = d.datum ?? '';
				const uhrzeit: string = d.uhrzeit ?? '';
				const titel: string = d.titel ?? doc.uid;
				const sessionLaenge: number | null = d.session_laenge ?? null;
				const zeitzone: string = d.zeitzone ?? 'Europe/Zurich';

				// Human-readable label: "Mi 15.01.2025, 14:00 – Erstgespräch (60 min)"
				let label = '';
				if (datum) {
					const date = new Date(datum + 'T12:00:00Z');
					const formatted = date.toLocaleDateString('de-CH', {
						weekday: 'short',
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
						timeZone: 'UTC'
					});
					label = formatted;
					if (uhrzeit) label += `, ${uhrzeit}`;
					if (titel) label += ` – ${titel}`;
					if (sessionLaenge) label += ` (${sessionLaenge} min)`;
				} else {
					label = titel || doc.uid;
				}

				return {
					id: doc.uid,
					titel,
					datum,
					uhrzeit,
					sessionLaenge,
					zeitzone,
					label
				} satisfies AvailableTermin;
			})
		);

		const available = withAvailability.filter((t): t is AvailableTermin => t !== null);

		// Sort by date + time
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
