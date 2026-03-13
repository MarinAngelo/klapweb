import type { RequestHandler } from '@sveltejs/kit';
import { bookSlot, isBooked } from '$lib/server/bookings';
import { createClient } from '$lib/prismicio';

export const POST: RequestHandler = async ({ request, fetch }) => {
	let body: { terminId?: string; name?: string; email?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Ungültige Anfrage' }), { status: 400 });
	}

	const { terminId, name, email } = body;
	if (!terminId) {
		return new Response(JSON.stringify({ error: 'terminId fehlt' }), { status: 400 });
	}

	// Check if already booked
	const alreadyBooked = await isBooked(terminId);
	if (alreadyBooked) {
		return new Response(
			JSON.stringify({ error: 'Dieser Termin ist leider nicht mehr verfügbar.' }),
			{ status: 409 }
		);
	}

	// Fetch termin details from Prismic
	let datum = '';
	let uhrzeit = '';
	let titel = terminId;
	try {
		const client = createClient({ fetch });
		const doc = await client.getByUID('terminplanung', terminId);
		const d = doc.data as any;
		datum = d.datum ?? '';
		uhrzeit = d.uhrzeit ?? '';
		titel = d.titel ?? terminId;
	} catch {
		// Termin not found in Prismic — reject
		return new Response(JSON.stringify({ error: 'Termin nicht gefunden' }), { status: 404 });
	}

	await bookSlot({
		terminId,
		datum,
		uhrzeit,
		titel,
		bookedAt: new Date().toISOString(),
		name,
		email
	});

	return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
