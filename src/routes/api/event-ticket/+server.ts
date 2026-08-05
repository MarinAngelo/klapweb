import { json } from '@sveltejs/kit';
import { getTicketCount, incrementTicketCount } from '$lib/server/eventTickets';
import { createClient } from '$lib/prismicio';

export async function GET({ url, fetch }) {
	const uid = url.searchParams.get('uid');
	if (!uid) return json({ error: 'uid fehlt' }, { status: 400 });

	try {
		const count = await getTicketCount(uid);

		// Optional: max_participants aus Prismic laden für fullyBooked-Flag
		let maxParticipants: number | null = null;
		try {
			const client = createClient({ fetch });
			const doc = await client.getByUID('event', uid);
			maxParticipants = (doc.data as Record<string, unknown>).max_participants as number | null ?? null;
		} catch {
			// Event nicht gefunden – kein max bekannt
		}

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
