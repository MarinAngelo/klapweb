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
import { createClient } from '$lib/prismicio';

export interface ZimmerAuswahl {
	/** Room name in the main language — the room's identity (availability, conflicts) */
	zimmer_name: string;
	/** Room name in the booking language (mails); empty = same as zimmer_name */
	zimmer_label?: string;
	bett_typ: string;
	anzahl_betten: number;
}

export interface RessourceBuchung {
	id: string; // blob key (ressourceUid/timestamp_uuid)
	referenz: string; // short human-readable code (6 chars uppercase)
	ressourceUid: string;
	ressourceName?: string;
	von: string; // YYYY-MM-DD (check-in, inclusive)
	bis: string; // YYYY-MM-DD (check-out, exclusive)
	personen: number;
	zimmerauswahl?: ZimmerAuswahl[]; // leer = ganze Ressource gebucht
	preisCHF: number;
	bookedAt: string;
	status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'abgerechnet';
	name?: string;
	email?: string;
	telefon?: string;
	nachricht?: string;
	lang?: string; // Prismic locale of the booking page → language of the guest mails
	checkedInAt?: string;
	checkOutAt?: string;
	checkInItems?: string[];
	checkOutItems?: string[];
	creditsCHF?: number; // summe erledigter Aufgaben-Credits
	abrechnungBetrag?: number; // freigegebener Endbetrag (manuell korrigierbar)
	abrechnungFreigegebenAt?: string;
	reminderSent?: boolean;
	nachAnkunftReminderSent?: boolean;
	abreiseReminderSent?: boolean;
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
	return records.filter(Boolean).sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
}

// ── Room identity ─────────────────────────────────────────────────────────────
// A room is identified by its name in the main language document. Names in other
// languages are mapped to it (translation of the same group entry). Old bookings made
// in another language are mapped the same way.

type RoomNames = {
	/** room name in the main language (reference) */
	main: string[];
	/** name in any language → main language name */
	toMain: Map<string, string>;
	/** main language name → name per language */
	byLang: Map<string, Map<string, string>>;
};

const roomLabel = (z: { zimmer_name?: string | null; bett_typ?: string | null }) =>
	z.zimmer_name || z.bett_typ || '';

export async function loadRoomNames(uid: string): Promise<RoomNames> {
	const result: RoomNames = { main: [], toMain: new Map(), byLang: new Map() };
	try {
		const client = createClient();
		const [mainDoc, all] = await Promise.all([
			client.getByUID('ressource' as any, uid),
			client.getAllByType('ressource' as any, { lang: '*' })
		]);
		result.main = (((mainDoc.data as any)?.schlafzimmer ?? []) as any[]).map(roomLabel);
		result.main.forEach((name) => result.toMain.set(name, name));
		const translations = (all as any[]).filter((d) => d.uid === uid && d.lang !== mainDoc.lang);
		for (const doc of translations) {
			const names = ((doc.data?.schlafzimmer ?? []) as any[]).map(roomLabel);
			const map = new Map<string, string>();
			result.main.forEach((mainName, i) => {
				const name = names[i];
				if (!name) return;
				map.set(mainName, name);
				if (!result.toMain.has(name)) result.toMain.set(name, mainName);
			});
			result.byLang.set(doc.lang, map);
		}
	} catch (err) {
		console.error(`[ressourceBuchungen] loadRoomNames(${uid}) Fehler:`, err);
	}
	return result;
}

/** Main language room names of a booking; null = whole resource or a room that cannot be identified */
function bookedRooms(
	b: Pick<RessourceBuchung, 'zimmerauswahl'>,
	rooms: RoomNames
): string[] | null {
	const auswahl = b.zimmerauswahl ?? [];
	if (auswahl.length === 0) return null;
	const names = auswahl.map((z) => rooms.toMain.get(roomLabel(z)));
	// Unknown room (e.g. renamed since) → block the whole resource rather than risk a double booking
	return names.every(Boolean) ? (names as string[]) : null;
}

/**
 * Returns all booked periods for one or more resource UIDs combined.
 * The first UID is the resource being viewed; its room names are returned in `lang`.
 * zimmer: [] means the whole resource is blocked (no room selection, or a related resource).
 */
export async function getBelegtePerioden(
	ressourceUids: string | string[],
	lang?: string
): Promise<Array<{ von: string; bis: string; zimmer: string[] }>> {
	const uids = Array.isArray(ressourceUids) ? ressourceUids : [ressourceUids];
	const ownUid = uids[0];
	const [all, rooms] = await Promise.all([
		Promise.all(uids.map(listRessourceBuchungen)),
		loadRoomNames(ownUid)
	]);
	const display = (lang && rooms.byLang.get(lang)) || null;
	return all.flat().map((b) => {
		const names = b.ressourceUid === ownUid ? bookedRooms(b, rooms) : null;
		return {
			von: b.von,
			bis: b.bis,
			zimmer: names ? names.map((n) => display?.get(n) ?? n) : []
		};
	});
}

/**
 * Resolves parent + child UIDs for a resource via Prismic.
 * Returns all UIDs whose availability must be checked together.
 */
export async function getRelatedRessourceUids(
	uid: string,
	fetch: typeof globalThis.fetch
): Promise<string[]> {
	try {
		const client = createClient({ fetch });
		const [doc, allDocs] = await Promise.all([
			client.getByUID('ressource', uid).catch(() => null),
			client.getAllByType('ressource').catch(() => [])
		]);
		const children: string[] = ((doc?.data as any)?.untergeordnete_ressourcen ?? [])
			.map((item: any) => item?.ressource?.uid)
			.filter(Boolean);
		const parents: string[] = (allDocs as any[])
			.filter((d) =>
				((d.data as any)?.untergeordnete_ressourcen ?? []).some(
					(item: any) => item?.ressource?.uid === uid
				)
			)
			.map((d: any) => d.uid)
			.filter(Boolean);
		const all = [...new Set([uid, ...children, ...parents])];
		return all;
	} catch (err) {
		console.error(`[ressourceBuchungen] getRelatedRessourceUids(${uid}) Fehler:`, err);
		return [uid];
	}
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
	if (buchung.status === 'checked_in' || buchung.status === 'checked_out')
		throw new Error('ALREADY_DONE');
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

export async function checkOutBuchung(
	referenz: string,
	items: string[]
): Promise<RessourceBuchung> {
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

export async function bucheRessource(
	buchung: Omit<RessourceBuchung, 'id' | 'referenz'>,
	conflictUids: string[] = []
): Promise<RessourceBuchung> {
	// Prüfe Konflikte auf eigener Ressource + alle verwandten UIDs
	const allUids = [...new Set([buchung.ressourceUid, ...conflictUids])];
	const allExisting = (await Promise.all(allUids.map(listRessourceBuchungen))).flat();
	const overlapping = allExisting.filter((b) =>
		datesOverlap(buchung.von, buchung.bis, b.von, b.bis)
	);

	// Rooms are compared by their main language name, see bookedRooms()
	const rooms = await loadRoomNames(buchung.ressourceUid);
	const requested = bookedRooms(buchung, rooms);

	if (!requested) {
		// Ganze Ressource (oder Zimmer nicht zuordenbar): jede Überschneidung = Konflikt
		if (overlapping.length > 0) throw new Error('CONFLICT');
	} else {
		// Einzelne Zimmer: Konflikt wenn ganze/verwandte Ressource belegt ODER selbes Zimmer gebucht
		const belegt = new Set<string>();
		for (const b of overlapping) {
			const names = b.ressourceUid === buchung.ressourceUid ? bookedRooms(b, rooms) : null;
			if (!names) throw new Error('CONFLICT');
			names.forEach((n) => belegt.add(n));
		}
		if (requested.some((n) => belegt.has(n))) throw new Error('CONFLICT');
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

/** Update booking (partial patch). */
export async function updateRessourceBuchung(
	id: string,
	patch: Partial<RessourceBuchung>
): Promise<RessourceBuchung> {
	const store = getStore_();
	const existing = (await store.get(id, { type: 'json' })) as RessourceBuchung | null;
	if (!existing) throw new Error('Buchung nicht gefunden');
	const updated = { ...existing, ...patch };
	await store.setJSON(id, updated);
	return updated;
}

/** Update booking status. */
export async function updateRessourceBuchungStatus(
	id: string,
	status: RessourceBuchung['status']
): Promise<RessourceBuchung> {
	return updateRessourceBuchung(id, { status });
}

/** Delete a booking (admin). */
export async function deleteRessourceBuchung(id: string): Promise<void> {
	const store = getStore_();
	await store.delete(id);
}
