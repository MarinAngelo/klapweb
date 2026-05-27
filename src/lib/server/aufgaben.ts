import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';

export type AufgabeAnnahmeStatus = 'angenommen' | 'annahme_bestaetigt' | 'eingereicht' | 'erledigt';

export interface AufgabeAnnahme {
	id: string;
	aufgabeUid: string;
	aufgabeTitel: string;
	buchungId: string;
	ressourceUid: string;
	name: string;
	email: string;
	status: AufgabeAnnahmeStatus;
	creditTyp: 'fest' | 'offen';
	creditBetrag?: number;
	preisProNacht?: number;
	minuten?: number;
	credits?: number;
	kommentar?: string;
	betreiberAntwort?: string;
	angenommenAt: string;
	bestaetgtAt?: string;
	eingereichtAt?: string;
	erledigtAt?: string;
}

function getStore_() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) throw new Error('Netlify Blobs: NETLIFY_SITE_ID oder NETLIFY_TOKEN fehlt');
	return getStore({ name: 'aufgaben_annahmen', siteID, token });
}

export async function listAnnahmenFuerBuchung(buchungId: string): Promise<AufgabeAnnahme[]> {
	const store = getStore_();
	const { blobs } = await store.list({ prefix: `buchung_${buchungId}/` });
	const records = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<AufgabeAnnahme>)
	);
	return records.filter(Boolean);
}

export async function listAlleAnnahmen(): Promise<AufgabeAnnahme[]> {
	const store = getStore_();
	const { blobs } = await store.list();
	const records = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<AufgabeAnnahme>)
	);
	return records.filter(Boolean).sort((a, b) => a.angenommenAt.localeCompare(b.angenommenAt));
}

export async function getAnnahme(id: string): Promise<AufgabeAnnahme | null> {
	const store = getStore_();
	return store.get(id, { type: 'json' }) as Promise<AufgabeAnnahme | null>;
}

export async function createAnnahme(data: Omit<AufgabeAnnahme, 'id'>): Promise<AufgabeAnnahme> {
	const store = getStore_();
	const id = `buchung_${data.buchungId}/${Date.now()}_${crypto.randomUUID()}`;
	const record: AufgabeAnnahme = { id, ...data };
	await store.setJSON(id, record);
	return record;
}

export async function updateAnnahme(id: string, patch: Partial<AufgabeAnnahme>): Promise<AufgabeAnnahme> {
	const store = getStore_();
	const existing = await store.get(id, { type: 'json' }) as AufgabeAnnahme | null;
	if (!existing) throw new Error('Annahme nicht gefunden');
	const updated = { ...existing, ...patch };
	await store.setJSON(id, updated);
	return updated;
}

export async function deleteAnnahme(id: string): Promise<void> {
	const store = getStore_();
	await store.delete(id);
}

/** Berechnet Credits: offen = (minuten / 60) × preisProNacht; fest = creditBetrag */
export function berechneCredits(annahme: Pick<AufgabeAnnahme, 'creditTyp' | 'creditBetrag' | 'preisProNacht' | 'minuten'>): number {
	if (annahme.creditTyp === 'fest') return annahme.creditBetrag ?? 0;
	if (!annahme.minuten || !annahme.preisProNacht) return 0;
	return Math.round((annahme.minuten / 60) * annahme.preisProNacht * 100) / 100;
}
