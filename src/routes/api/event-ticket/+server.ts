import { json } from '@sveltejs/kit';
import { incrementTicketCount } from '$lib/server/eventTickets';
import { listEventRegistrations } from '$lib/server/eventRegistrations';

export async function GET({ url }) {
	const uid = url.searchParams.get('uid');
	if (!uid) return json({ error: 'uid fehlt' }, { status: 400 });

	try {
		// Direkt aus event-registrations zählen — immer korrekt
		const all = await listEventRegistrations();
		const count = all.filter((r) => r.eventUid === uid).length;

		const maxParam = url.searchParams.get('max');
		const maxParticipants: number | null = maxParam ? parseInt(maxParam) : null;

		const fullyBooked = maxParticipants !== null && maxParticipants > 0 && count >= maxParticipants;
		return json({ count, maxParticipants, fullyBooked });
	} catch {
		return json({ count: 0, maxParticipants: null, fullyBooked: false });
	}
}

export async function POST({ request }) {
	const body = await request.json().catch(() => ({}));
	const { eventUid } = body as { eventUid?: string };
	if (!eventUid) return json({ error: 'eventUid fehlt' }, { status: 400 });

	try {
		const newCount = await incrementTicketCount(eventUid);
		return json({ count: newCount });
	} catch {
		return json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
	}
}
