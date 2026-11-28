/**
 * Bridge «Stundenabrechnung» → «Assistenz» (prepared, not connected yet).
 *
 * Pure functions (server + browser): turn time sheet entries (Blob store `stunden`,
 * $lib/server/stunden.ts) into the monthly day/night hours of the Assistenz module
 * (`MonatsStunden.stunden`, $lib/assistenz.ts). Nothing is saved here.
 *
 * To connect later (e.g. button «Aus Stundenabrechnung übernehmen» in /admin/assistenz):
 *   const { stunden, unbekannt } = zuAssistenzStunden(listStunden(), monat, config.personen);
 *   → show `unbekannt`, merge `stunden` into loadMonat(monat) and saveMonat(monat, …)
 */
import { rappen, type Monat, type Person, type StundenEintrag } from '$lib/assistenz';

/** The fields of a time sheet entry the bridge needs (StundenEintrag of $lib/server/stunden) */
export type ErfassteStunden = {
	von: string;
	bis: string;
	name?: string;
	/** missing = day hours */
	art?: 'tag' | 'nacht';
};

/** Month of an entry = month of its start («2026-09-30T22:00» → «2026-09») */
export const monatVon = (e: Pick<ErfassteStunden, 'von'>): Monat => e.von.slice(0, 7);

const minuten = (e: ErfassteStunden) => {
	const ms = Date.parse(`${e.bis}:00Z`) - Date.parse(`${e.von}:00Z`);
	return Number.isFinite(ms) && ms > 0 ? Math.round(ms / 60000) : 0;
};

const nameKey = (name = '') => name.trim().toLowerCase();

/** Day/night hours per person (name as entered) of one month, hours with 2 decimals */
export function monatsSummen(
	entries: ErfassteStunden[],
	monat: Monat
): { name: string; tag: number; nacht: number }[] {
	const byName = new Map<string, { name: string; tagMin: number; nachtMin: number }>();
	for (const e of entries) {
		if (monatVon(e) !== monat || !nameKey(e.name)) continue;
		const sum = byName.get(nameKey(e.name)) ?? {
			name: e.name!.trim(),
			tagMin: 0,
			nachtMin: 0
		};
		if (e.art === 'nacht') sum.nachtMin += minuten(e);
		else sum.tagMin += minuten(e);
		byName.set(nameKey(e.name), sum);
	}
	return [...byName.values()].map((s) => ({
		name: s.name,
		tag: rappen(s.tagMin / 60),
		nacht: rappen(s.nachtMin / 60)
	}));
}

/**
 * Hours of one month in the form of the Assistenz module: key = person id, matched by name
 * (case-insensitive, like the Assistenz import). Names without an Assistenz person → `unbekannt`.
 */
export function zuAssistenzStunden(
	entries: ErfassteStunden[],
	monat: Monat,
	personen: Person[]
): { stunden: Record<string, StundenEintrag>; unbekannt: string[] } {
	const personByName = new Map(personen.map((p) => [nameKey(p.name), p]));
	const stunden: Record<string, StundenEintrag> = {};
	const unbekannt: string[] = [];
	for (const s of monatsSummen(entries, monat)) {
		const person = personByName.get(nameKey(s.name));
		if (!person) {
			unbekannt.push(s.name);
			continue;
		}
		stunden[person.id] = { tag: s.tag, nacht: s.nacht };
	}
	return { stunden, unbekannt };
}
