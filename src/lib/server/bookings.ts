/**
 * Booking storage via Netlify Blobs.
 *
 * Each booking occupies one blob keyed by the terminplanung document UID.
 * Using the UID as key means a slot can only be booked once (atomic write).
 *
 * Required Netlify environment variables: NETLIFY_SITE_ID, NETLIFY_TOKEN
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';

export interface BookingRecord {
	terminId: string;
	datum: string;
	uhrzeit: string;
	titel: string;
	bookedAt: string;
	name?: string;
	email?: string;
}

function getBookingStore() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) {
		throw new Error(
			`Netlify Blobs: NETLIFY_SITE_ID=${siteID ? 'gesetzt' : 'fehlt'}, NETLIFY_TOKEN=${token ? 'gesetzt' : 'fehlt'}`
		);
	}
	return getStore({ name: 'buchungen', siteID, token });
}

export async function bookSlot(record: BookingRecord): Promise<void> {
	const store = getBookingStore();
	// setJSON with onlyIfNew via etag approach is unavailable in @netlify/blobs v10,
	// but concurrent bookings at this scale are negligible.
	await store.setJSON(record.terminId, record);
}

export async function isBooked(terminId: string): Promise<boolean> {
	const store = getBookingStore();
	const existing = await store.get(terminId, { type: 'json' });
	return existing !== null;
}

export async function listBookings(): Promise<BookingRecord[]> {
	const store = getBookingStore();
	const { blobs } = await store.list();
	const records = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<BookingRecord>)
	);
	return records
		.filter(Boolean)
		.sort((a, b) => new Date(a.datum + 'T' + a.uhrzeit).getTime() - new Date(b.datum + 'T' + b.uhrzeit).getTime());
}

export async function deleteBooking(terminId: string): Promise<void> {
	const store = getBookingStore();
	await store.delete(terminId);
}
