/**
 * Assistenz (feature `assistenz`): storage in Netlify Blobs, store `assistenz`.
 *   `config`         → persons, rates/deductions, start month of the year (AssistenzConfig)
 *   `monat-YYYY-MM`  → hours of all persons in that month (MonatsStunden)
 * Calculation: $lib/assistenz.ts. Admin pages: /admin/assistenz (protected in hooks.server.ts).
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';
import {
	DEFAULT_CONFIG,
	isMonat,
	parseStunden,
	rappen,
	type Abzug,
	type AssistenzConfig,
	type Monat,
	type MonatsStunden,
	type Person,
	type Saetze,
	type StundenEintrag
} from '$lib/assistenz';

const CONFIG_KEY = 'config';
const monatKey = (monat: Monat) => `monat-${monat}`;

function getAssistenzStore() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) {
		throw new Error(
			`Netlify Blobs: NETLIFY_SITE_ID=${siteID ? 'gesetzt' : 'fehlt'}, NETLIFY_TOKEN=${token ? 'gesetzt' : 'fehlt'}`
		);
	}
	return getStore({ name: 'assistenz', siteID, token, consistency: 'strong' });
}

export async function loadConfig(): Promise<AssistenzConfig> {
	const stored = (await getAssistenzStore().get(CONFIG_KEY, {
		type: 'json'
	})) as Partial<AssistenzConfig> | null;
	return {
		jahresbeginn: stored?.jahresbeginn ?? DEFAULT_CONFIG.jahresbeginn,
		personen: stored?.personen ?? [],
		saetze: stored?.saetze ?? []
	};
}

export async function saveConfig(config: AssistenzConfig) {
	await getAssistenzStore().setJSON(CONFIG_KEY, config);
}

export async function loadMonat(monat: Monat): Promise<MonatsStunden | null> {
	return (await getAssistenzStore().get(monatKey(monat), { type: 'json' })) as MonatsStunden | null;
}

export async function loadMonate(monate: Monat[]): Promise<Record<Monat, MonatsStunden | null>> {
	const list = await Promise.all(monate.map((m) => loadMonat(m)));
	return Object.fromEntries(monate.map((m, i) => [m, list[i]]));
}

/** All stored months (for «has this person hours anywhere?») */
async function loadAlleMonate(): Promise<MonatsStunden[]> {
	const store = getAssistenzStore();
	const { blobs } = await store.list({ prefix: 'monat-' });
	const list = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<MonatsStunden | null>)
	);
	return list.filter((m): m is MonatsStunden => !!m);
}

const TEXT_MAX = 80;
const text = (v: unknown, max = TEXT_MAX) =>
	String(v ?? '')
		.trim()
		.slice(0, max);

/** Parses «8,5» / «35.30»; empty → undefined, invalid → NaN */
function parseBetrag(raw: unknown): number | undefined {
	const s = text(raw).replace(',', '.');
	if (s === '') return undefined;
	const n = Number(s);
	return Number.isFinite(n) && n >= 0 && n <= 100000 ? n : NaN;
}

const optionalMonat = (raw: unknown): Monat | undefined | null => {
	const s = text(raw);
	if (!s) return undefined;
	return isMonat(s) ? s : null;
};

// ── Hours of a month ─────────────────────────────────────────────────────────

/**
 * Saves the hours of a month from the form fields `tag_<personId>` / `nacht_<personId>`.
 * Only known persons; empty fields are dropped. Returns an i18n error key or null.
 */
export async function saveMonatAusFormular(
	monat: Monat,
	form: Record<string, unknown>
): Promise<string | null> {
	const config = await loadConfig();
	const stunden: Record<string, StundenEintrag> = {};
	for (const p of config.personen) {
		const tag = parseStunden(form[`tag_${p.id}`]);
		const nacht = parseStunden(form[`nacht_${p.id}`]);
		if (Number.isNaN(tag) || Number.isNaN(nacht)) {
			return 'Stunden: bitte Zahlen wie 8 oder 8.5 eingeben.';
		}
		if (tag !== undefined || nacht !== undefined) {
			stunden[p.id] = {
				...(tag !== undefined && { tag }),
				...(nacht !== undefined && { nacht })
			};
		}
	}
	await saveMonat(monat, stunden);
	return null;
}

/** Stores the hours of a month (no hours → the month is removed) */
export async function saveMonat(monat: Monat, stunden: Record<string, StundenEintrag>) {
	const store = getAssistenzStore();
	if (Object.keys(stunden).length === 0) {
		await store.delete(monatKey(monat));
	} else {
		await store.setJSON(monatKey(monat), {
			monat,
			stunden,
			updatedAt: new Date().toISOString()
		} satisfies MonatsStunden);
	}
}

/** New person id (8 hex characters, see isValidPersonId) */
export const neuePersonId = () => randomUUID().slice(0, 8);

// ── Persons ──────────────────────────────────────────────────────────────────

function parsePerson(form: Record<string, unknown>): Omit<Person, 'id'> | { error: string } {
	const name = text(form.name);
	if (!name) return { error: 'Bitte einen Namen eintragen.' };
	const aktivAb = optionalMonat(form.aktivAb);
	const aktivBis = optionalMonat(form.aktivBis);
	if (aktivAb === null || aktivBis === null) {
		return { error: 'Monat bitte im Format JJJJ-MM eingeben, z.B. 2026-09.' };
	}
	if (aktivAb && aktivBis && aktivBis < aktivAb) {
		return { error: '«Aktiv bis» muss nach «Aktiv ab» liegen.' };
	}
	return {
		name,
		anstellung: text(form.anstellung),
		...(aktivAb && { aktivAb }),
		...(aktivBis && { aktivBis })
	};
}

export async function addPerson(form: Record<string, unknown>): Promise<string | null> {
	const input = parsePerson(form);
	if ('error' in input) return input.error;
	const config = await loadConfig();
	config.personen.push({ id: neuePersonId(), ...input });
	await saveConfig(config);
	return null;
}

export async function updatePerson(id: string, form: Record<string, unknown>) {
	const input = parsePerson(form);
	if ('error' in input) return input.error;
	const config = await loadConfig();
	const index = config.personen.findIndex((p) => p.id === id);
	if (index < 0) return 'Person nicht gefunden.';
	config.personen[index] = { id, ...input };
	await saveConfig(config);
	return null;
}

export async function movePerson(id: string, richtung: -1 | 1) {
	const config = await loadConfig();
	const i = config.personen.findIndex((p) => p.id === id);
	const j = i + richtung;
	if (i < 0 || j < 0 || j >= config.personen.length) return;
	[config.personen[i], config.personen[j]] = [config.personen[j], config.personen[i]];
	await saveConfig(config);
}

/** Only persons without any recorded hours (otherwise months would lose rows) */
export async function deletePerson(id: string): Promise<string | null> {
	const monate = await loadAlleMonate();
	const used = monate.some((m) => {
		const e = m.stunden[id];
		return !!e && ((e.tag ?? 0) > 0 || (e.nacht ?? 0) > 0);
	});
	if (used) {
		return 'Diese Person hat erfasste Stunden und kann nicht gelöscht werden. Stattdessen «Aktiv bis» setzen.';
	}
	const config = await loadConfig();
	config.personen = config.personen.filter((p) => p.id !== id);
	await saveConfig(config);
	return null;
}

// ── Rates and deductions ─────────────────────────────────────────────────────

/** Form: gueltigAb, tag, nacht, abzug_name (multiple), abzug_prozent (multiple) */
function parseSaetze(form: FormData): Saetze | { error: string } {
	const gueltigAb = text(form.get('gueltigAb'));
	if (!isMonat(gueltigAb)) {
		return { error: 'Monat bitte im Format JJJJ-MM eingeben, z.B. 2026-09.' };
	}
	const tag = parseBetrag(form.get('tag'));
	const nacht = parseBetrag(form.get('nacht'));
	if (tag === undefined || nacht === undefined || Number.isNaN(tag) || Number.isNaN(nacht)) {
		return { error: 'Bitte die Stundensätze für Tag und Nacht eintragen, z.B. 35.30.' };
	}
	const names = form.getAll('abzug_name');
	const prozente = form.getAll('abzug_prozent');
	const abzuege: Abzug[] = [];
	for (let i = 0; i < names.length; i++) {
		const name = text(names[i]);
		const prozent = parseBetrag(prozente[i]);
		if (!name && prozent === undefined) continue;
		if (!name) return { error: 'Jeder Abzug braucht eine Bezeichnung.' };
		if (prozent === undefined || Number.isNaN(prozent) || prozent > 100) {
			return { error: 'Abzüge: Prozent bitte als Zahl zwischen 0 und 100 eingeben, z.B. 5.3.' };
		}
		abzuege.push({ name, prozent: Math.round(prozent * 10000) / 10000 });
	}
	return { gueltigAb, tag: rappen(tag), nacht: rappen(nacht), abzuege };
}

/**
 * Creates or replaces the version with the same «gültig ab» month.
 * `original` = month of the edited version (changing «gültig ab» moves it).
 */
export async function saveSaetze(form: FormData): Promise<string | null> {
	const input = parseSaetze(form);
	if ('error' in input) return input.error;
	const original = text(form.get('original'));
	const config = await loadConfig();
	if (input.gueltigAb !== original && config.saetze.some((s) => s.gueltigAb === input.gueltigAb)) {
		return 'Für diesen Monat gibt es schon Sätze — bitte diese bearbeiten.';
	}
	config.saetze = [
		...config.saetze.filter((s) => s.gueltigAb !== original && s.gueltigAb !== input.gueltigAb),
		input
	].sort((a, b) => a.gueltigAb.localeCompare(b.gueltigAb));
	await saveConfig(config);
	return null;
}

export async function deleteSaetze(gueltigAb: string) {
	const config = await loadConfig();
	config.saetze = config.saetze.filter((s) => s.gueltigAb !== gueltigAb);
	await saveConfig(config);
}

export async function setJahresbeginn(raw: unknown): Promise<string | null> {
	const monat = Number(raw);
	if (!Number.isInteger(monat) || monat < 1 || monat > 12) return 'Ungültiger Monat.';
	const config = await loadConfig();
	config.jahresbeginn = monat;
	await saveConfig(config);
	return null;
}

export const isValidPersonId = (v: unknown): v is string =>
	typeof v === 'string' && /^[a-f0-9]{8}$/.test(v);
