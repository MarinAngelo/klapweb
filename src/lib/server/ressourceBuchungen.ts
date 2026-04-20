/**
 * Resource booking storage via Netlify Blobs.
 *
 * Each booking is stored as a separate blob with a unique key.
 * Key format: `{ressourceUid}/{timestamp}_{uuid4}`
 * This allows listing all bookings for a specific resource via prefix.
 *
 * Required env vars: NETLIFY_SITE_ID, NETLIFY_TOKEN
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';

export interface ZimmerAuswahl {
	zimmer_name: string;
	bett_typ: string;
	anzahl_betten: number;
}

export interface RessourceBuchung {
	id: string;           // blob key (ressourceUid/timestamp_uuid)
	ressourceUid: string;
	von: string;          // YYYY-MM-DD (check-in, inclusive)
	bis: string;          // YYYY-MM-DD (check-out, exclusive)
	personen: number;
	zimmerauswahl?: ZimmerAuswahl[];
	preisCHF: number;
	bookedAt: string;
	name?: string;
	email?: string;
	telefon?: string;
	nachricht?: string;
}

function getStore_() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) {
		throw new Error(
			`Netlify Blobs: NETLIFY_SITE_ID=${siteID ? 'gesetzt' : 'fehlt'}, NETLIFY_TOKEN=${token ? 'gesetzt' : 'fehlt'}`
		);
	}
	return getStore({ name: 'ressource_buchungen', siteID, token });
}

/** Returns true if [vonA, bisA) overlaps with [vonB, bisB). */
export function datesOverlap(vonA: string, bisA: string, vonB: string, bisB: string): boolean {
	return vonA < bisB && vonB < bisA;
}

/** List all bookings for a specific resource. */
export async function listRessourceBuchungen(ressourceUid: string): Promise<RessourceBuchung[]> {
	const store = getStore_();
	const { blobs } = await store.list({ prefix: `${ressourceUid}/` });
	const records = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<RessourceBuchung>)
	);
	return records.filter(Boolean);
}

/** List all bookings across all resources (for admin). */
export async function listAlleRessourceBuchungen(): Promise<RessourceBuchung[]> {
	const store = getStore_();
	const { blobs } = await store.list();
	const records = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<RessourceBuchung>)
	);
	return records
		.filter(Boolean)
		.sort((a, b) => a.von.localeCompare(b.von));
}

/**
 * Returns all overlapping bookings for a period, each with their booked room names.
 */
export async function getBelegtePerioden(
	ressourceUid: string
): Promise<Array<{ von: string; bis: string; zimmer: string[] }>> {
	const existing = await listRessourceBuchungen(ressourceUid);
	return existing.map((b) => ({
		von: b.von,
		bis: b.bis,
		zimmer: (b.zimmerauswahl ?? []).map((z) => z.zimmer_name || z.bett_typ)
	}));
}

/**
 * Returns the room names that are already booked in the given period.
 */
export async function getBelegteZimmer(
	ressourceUid: string,
	von: string,
	bis: string
): Promise<Set<string>> {
	const existing = await listRessourceBuchungen(ressourceUid);
	const overlapping = existing.filter((b) => datesOverlap(von, bis, b.von, b.bis));
	const names = overlapping.flatMap((b) =>
		(b.zimmerauswahl ?? []).map((z) => z.zimmer_name || z.bett_typ)
	);
	return new Set(names);
}

/** Save a booking. Checks for room-level conflicts before saving. */
export async function bucheRessource(buchung: Omit<RessourceBuchung, 'id'>): Promise<RessourceBuchung> {
	const requestedNames = (buchung.zimmerauswahl ?? []).map((z) => z.zimmer_name || z.bett_typ);
	const belegteZimmer = await getBelegteZimmer(buchung.ressourceUid, buchung.von, buchung.bis);

	// If zimmerauswahl is empty, fall back to any-overlap check
	if (requestedNames.length === 0) {
		const existing = await listRessourceBuchungen(buchung.ressourceUid);
		if (existing.some((b) => datesOverlap(buchung.von, buchung.bis, b.von, b.bis))) {
			throw new Error('CONFLICT');
		}
	} else {
		const conflict = requestedNames.some((name) => belegteZimmer.has(name));
		if (conflict) throw new Error('CONFLICT');
	}

	const id = `${buchung.ressourceUid}/${Date.now()}_${crypto.randomUUID()}`;
	const record: RessourceBuchung = { id, ...buchung };

	const store = getStore_();
	await store.setJSON(id, record);
	return record;
}

/** Delete a booking (admin). */
export async function deleteRessourceBuchung(id: string): Promise<void> {
	const store = getStore_();
	await store.delete(id);
}
