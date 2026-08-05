import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';

function getTicketStore() {
	return getStore({
		name: 'event-tickets',
		siteID: env.NETLIFY_SITE_ID ?? '',
		token: env.NETLIFY_TOKEN ?? ''
	});
}

export async function getTicketCount(eventUid: string): Promise<number> {
	try {
		const store = getTicketStore();
		const raw = await store.get(eventUid, { type: 'json' }).catch(() => null);
		return (raw as { count?: number } | null)?.count ?? 0;
	} catch {
		return 0;
	}
}

export async function incrementTicketCount(eventUid: string): Promise<number> {
	const store = getTicketStore();
	const raw = await store.get(eventUid, { type: 'json' }).catch(() => null);
	const current = (raw as { count?: number } | null)?.count ?? 0;
	const newCount = current + 1;
	await store.setJSON(eventUid, { count: newCount });
	return newCount;
}

export async function isFullyBooked(eventUid: string, maxParticipants: number | null): Promise<boolean> {
	if (!maxParticipants || maxParticipants <= 0) return false;
	const count = await getTicketCount(eventUid);
	return count >= maxParticipants;
}
