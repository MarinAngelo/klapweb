/**
 * Time sheet (feature `stundenabrechnung`): one Netlify Blob per entry, store `stunden`.
 *
 * Entered via the Formular variation «Stundenabrechnung» on a password-protected page
 * (/api/stunden), listed and edited under /admin/stunden.
 * Times are local times of the site (Europe/Zurich) as entered: «YYYY-MM-DDTHH:MM».
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';

export type StundenEintrag = {
	id: string;
	/** Start and end, local time «YYYY-MM-DDTHH:MM» */
	von: string;
	bis: string;
	/** Who worked (missing in older entries) */
	name?: string;
	projekt: string;
	taetigkeit: string;
	/** Expenses in the site currency (CHF), 0 = none */
	spesen: number;
	/** What the expenses were for (e.g. «Zugbillett»); missing in older entries */
	spesenText?: string;
	createdAt: string;
	updatedAt?: string;
};

export type StundenInput = Pick<
	StundenEintrag,
	'von' | 'bis' | 'name' | 'projekt' | 'taetigkeit' | 'spesen' | 'spesenText'
>;

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const TEXT_MAX = 500;
/** One entry may last at most this long (typing errors like a wrong year) */
const MAX_MINUTES = 24 * 60;

function getStundenStore() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) {
		throw new Error(
			`Netlify Blobs: NETLIFY_SITE_ID=${siteID ? 'gesetzt' : 'fehlt'}, NETLIFY_TOKEN=${token ? 'gesetzt' : 'fehlt'}`
		);
	}
	return getStore({ name: 'stunden', siteID, token, consistency: 'strong' });
}

/** Minutes between two local times (both in the same time zone → plain difference) */
export function dauerMinuten(von: string, bis: string): number {
	const start = Date.parse(`${von}:00Z`);
	const end = Date.parse(`${bis}:00Z`);
	return Number.isFinite(start) && Number.isFinite(end) ? Math.round((end - start) / 60000) : 0;
}

/**
 * Validates and normalises a form or admin input.
 * Returns the cleaned values or an i18n key of the error.
 */
export function parseStundenInput(raw: Record<string, unknown>): StundenInput | { error: string } {
	const text = (v: unknown) =>
		String(v ?? '')
			.trim()
			.slice(0, TEXT_MAX);
	const name = text(raw.name).slice(0, 100);
	if (!name) return { error: 'Bitte deinen Namen eintragen.' };
	const von = text(raw.von);
	const bis = text(raw.bis);
	if (!LOCAL_DATETIME.test(von) || !LOCAL_DATETIME.test(bis)) {
		return { error: 'Bitte «Von» und «Bis» mit Datum und Uhrzeit ausfüllen.' };
	}
	const minutes = dauerMinuten(von, bis);
	if (minutes <= 0) return { error: '«Bis» muss nach «Von» liegen.' };
	if (minutes > MAX_MINUTES) return { error: 'Ein Eintrag darf höchstens 24 Stunden dauern.' };

	const spesenRaw = String(raw.spesen ?? '')
		.trim()
		.replace(',', '.');
	const spesen = spesenRaw === '' ? 0 : Number(spesenRaw);
	if (!Number.isFinite(spesen) || spesen < 0 || spesen > 100000) {
		return { error: 'Spesen: bitte einen Betrag wie 12.50 eingeben.' };
	}
	return {
		von,
		bis,
		name,
		projekt: text(raw.projekt),
		taetigkeit: text(raw.taetigkeit),
		spesen: Math.round(spesen * 100) / 100,
		spesenText: text(raw.spesenText)
	};
}

export async function addStunden(input: StundenInput): Promise<StundenEintrag> {
	// Key starts with the start time → listing is already chronological
	const id = `${input.von.replace(/[-:T]/g, '')}_${randomUUID().slice(0, 8)}`;
	const entry: StundenEintrag = { id, ...input, createdAt: new Date().toISOString() };
	await getStundenStore().setJSON(id, entry);
	return entry;
}

export async function listStunden(): Promise<StundenEintrag[]> {
	const store = getStundenStore();
	const { blobs } = await store.list();
	const entries = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<StundenEintrag | null>)
	);
	return entries.filter((e): e is StundenEintrag => !!e).sort((a, b) => a.von.localeCompare(b.von));
}

export async function updateStunden(id: string, input: StundenInput): Promise<boolean> {
	const store = getStundenStore();
	const existing = (await store.get(id, { type: 'json' })) as StundenEintrag | null;
	if (!existing) return false;
	await store.setJSON(id, { ...existing, ...input, updatedAt: new Date().toISOString() });
	return true;
}

export async function deleteStunden(id: string): Promise<void> {
	await getStundenStore().delete(id);
}

export const isValidStundenId = (value: unknown): value is string =>
	typeof value === 'string' && /^\d{12}_[a-f0-9]{8}$/.test(value);
