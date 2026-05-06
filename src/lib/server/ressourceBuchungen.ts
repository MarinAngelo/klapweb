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
	referenz: string;     // short human-readable code (6 chars uppercase)
	ressourceUid: string;
	ressourceName?: string;
	von: string;          // YYYY-MM-DD (check-in, inclusive)
	bis: string;          // YYYY-MM-DD (check-out, exclusive)
	personen: number;
	zimmerauswahl?: ZimmerAuswahl[]; // leer = ganze Ressource gebucht
	preisCHF: number;
	bookedAt: string;
	status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out';
	name?: string;
	email?: string;
	telefon?: string;
	nachricht?: string;
	checkedInAt?: string;
	checkOutAt?: string;
	checkInItems?: string[];
	checkOutItems?: string[];
}

function generateReferenz(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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
 * Returns all booked periods with their booked room names.
 * zimmer: [] means the whole resource was booked (no room selection).
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

/** Save a booking. Checks for conflicts before saving.
 *
 * Conflict rules:
 * - zimmerauswahl empty (whole resource): any overlapping booking → conflict
 * - zimmerauswahl with rooms: any overlapping whole-resource booking OR same room → conflict
 */
export async function getBuchungByReferenz(referenz: string): Promise<RessourceBuchung | null> {
	const store = getStore_();
	const { blobs } = await store.list();
	const records = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<RessourceBuchung>)
	);
	const upper = referenz.toUpperCase();
	return records.find((r) => r?.referenz?.toUpperCase() === upper || r?.id === referenz) ?? null;
}

export async function checkInBuchung(referenz: string, items: string[]): Promise<RessourceBuchung> {
	const buchung = await getBuchungByReferenz(referenz);
	if (!buchung) throw new Error('NOT_FOUND');
	if (buchung.status === 'checked_in' || buchung.status === 'checked_out') throw new Error('ALREADY_DONE');
	const store = getStore_();
	const updated: RessourceBuchung = {
		...buchung,
		status: 'checked_in',
		checkedInAt: new Date().toISOString(),
		checkInItems: items
	};
	await store.setJSON(buchung.id, updated);
	return updated;
}

export async function checkOutBuchung(referenz: string, items: string[]): Promise<RessourceBuchung> {
	const buchung = await getBuchungByReferenz(referenz);
	if (!buchung) throw new Error('NOT_FOUND');
	if (buchung.status === 'checked_out') throw new Error('ALREADY_DONE');
	const store = getStore_();
	const updated: RessourceBuchung = {
		...buchung,
		status: 'checked_out',
		checkOutAt: new Date().toISOString(),
		checkOutItems: items
	};
	await store.setJSON(buchung.id, updated);
	return updated;
}

export async function bucheRessource(buchung: Omit<RessourceBuchung, 'id' | 'referenz'>): Promise<RessourceBuchung> {
	const existing = await listRessourceBuchungen(buchung.ressourceUid);
	const overlapping = existing.filter((b) => datesOverlap(buchung.von, buchung.bis, b.von, b.bis));

	const requestedNames = (buchung.zimmerauswahl ?? []).map((z) => z.zimmer_name || z.bett_typ);

	if (requestedNames.length === 0) {
		// Ganze Ressource: jede Überschneidung = Konflikt
		if (overlapping.length > 0) throw new Error('CONFLICT');
	} else {
		// Einzelne Zimmer: Konflikt wenn ganze Ressource belegt ODER selbes Zimmer gebucht
		const ganzeRessourceBelegt = overlapping.some((b) => (b.zimmerauswahl ?? []).length === 0);
		if (ganzeRessourceBelegt) throw new Error('CONFLICT');
		const belegteNamen = new Set(
			overlapping.flatMap((b) => (b.zimmerauswahl ?? []).map((z) => z.zimmer_name || z.bett_typ))
		);
		if (requestedNames.some((name) => belegteNamen.has(name))) throw new Error('CONFLICT');
	}

	const id = `${buchung.ressourceUid}/${Date.now()}_${crypto.randomUUID()}`;
	const record: RessourceBuchung = { id, referenz: generateReferenz(), ...buchung };
	const store = getStore_();
	await store.setJSON(id, record);
	return record;
}

/** Get a single booking by ID. */
export async function getRessourceBuchung(id: string): Promise<RessourceBuchung | null> {
	const store = getStore_();
	return store.get(id, { type: 'json' }) as Promise<RessourceBuchung | null>;
}

/** Update booking status. */
export async function updateRessourceBuchungStatus(
	id: string,
	status: 'pending' | 'confirmed'
): Promise<RessourceBuchung> {
	const store = getStore_();
	const existing = await store.get(id, { type: 'json' }) as RessourceBuchung | null;
	if (!existing) throw new Error('Buchung nicht gefunden');
	const updated = { ...existing, status };
	await store.setJSON(id, updated);
	return updated;
}

/** Delete a booking (admin). */
export async function deleteRessourceBuchung(id: string): Promise<void> {
	const store = getStore_();
	await store.delete(id);
}
