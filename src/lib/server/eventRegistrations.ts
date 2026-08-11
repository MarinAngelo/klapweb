import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';

export interface EventRegistration {
	id: string;
	eventUid: string;
	eventLabel: string;
	date: string;
	vorname: string;
	nachname: string;
	email: string | null;
	firma: string | null;
	paymentMethod: 'rechnung' | 'bar';
	amount: number | null;
	currency: string;
	invoiceNumber: string;
}

function getRegistrationStore() {
	return getStore({
		name: 'event-registrations',
		siteID: env.NETLIFY_SITE_ID ?? '',
		token: env.NETLIFY_TOKEN ?? ''
	});
}

export async function saveEventRegistration(data: Omit<EventRegistration, 'id'>): Promise<string> {
	const store = getRegistrationStore();
	const id = `${Date.now()}_${randomUUID()}`;
	await store.setJSON(id, { ...data, id });
	return id;
}

export async function listEventRegistrations(): Promise<EventRegistration[]> {
	const store = getRegistrationStore();
	const { blobs } = await store.list();
	const records = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }).catch(() => null))
	);
	return (records.filter(Boolean) as EventRegistration[]).sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);
}

export async function deleteEventRegistration(id: string): Promise<void> {
	const store = getRegistrationStore();
	await store.delete(id);
}
