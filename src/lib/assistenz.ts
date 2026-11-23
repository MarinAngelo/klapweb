/**
 * Assistenz (feature `assistenz`): monthly hours of the assistants → wages and deductions.
 *
 * Pure calculation, shared by server (CSV export) and browser (live totals while typing).
 * Storage: $lib/server/assistenz.ts, admin pages: /admin/assistenz.
 *
 * Per person and month: day hours × day rate + night hours × night rate = gross wage,
 * deductions = gross × percentage (each rounded to Rappen), net = gross − deductions.
 * Rates and deductions are versioned («gültig ab» month), so a rate change never
 * recalculates earlier months.
 */

/** «YYYY-MM» */
export type Monat = string;

export type Person = {
	id: string;
	name: string;
	/** Free text as in the former spreadsheet: «Fix», «Springer», «Springerin» … */
	anstellung: string;
	/** First and last month with work (inclusive); empty = open */
	aktivAb?: Monat;
	aktivBis?: Monat;
};

export type Abzug = { name: string; prozent: number };

/** Rates and deductions valid from a month until the next version */
export type Saetze = {
	gueltigAb: Monat;
	/** CHF per hour */
	tag: number;
	nacht: number;
	abzuege: Abzug[];
};

export type AssistenzConfig = {
	/** Month the assistance year starts with (1–12), e.g. 9 = September to August */
	jahresbeginn: number;
	/** Order = display order */
	personen: Person[];
	saetze: Saetze[];
};

export type StundenEintrag = { tag?: number; nacht?: number };

export type MonatsStunden = {
	monat: Monat;
	/** Key = person id */
	stunden: Record<string, StundenEintrag>;
	updatedAt?: string;
};

export const MONAT_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const isMonat = (v: unknown): v is Monat => typeof v === 'string' && MONAT_RE.test(v);

export const DEFAULT_CONFIG: AssistenzConfig = { jahresbeginn: 9, personen: [], saetze: [] };

/** Rounds to Rappen (avoids 0.1 + 0.2 artefacts) */
export const rappen = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function addMonate(monat: Monat, delta: number): Monat {
	const [y, m] = monat.split('-').map(Number);
	const index = y * 12 + (m - 1) + delta;
	return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/** First year of the assistance year that contains the month (Sept 2026 – Aug 2027 → 2026) */
export function jahrVonMonat(monat: Monat, jahresbeginn: number): number {
	const [y, m] = monat.split('-').map(Number);
	return m >= jahresbeginn ? y : y - 1;
}

/** The 12 months of an assistance year */
export function monateDesJahres(jahr: number, jahresbeginn: number): Monat[] {
	const start = `${jahr}-${String(jahresbeginn).padStart(2, '0')}`;
	return Array.from({ length: 12 }, (_, i) => addMonate(start, i));
}

/** Rates valid in the month: latest version with «gültig ab» ≤ month */
export function saetzeFuer(config: AssistenzConfig, monat: Monat): Saetze | null {
	return (
		[...config.saetze]
			.filter((s) => s.gueltigAb <= monat)
			.sort((a, b) => b.gueltigAb.localeCompare(a.gueltigAb))[0] ?? null
	);
}

export const personAktiv = (p: Person, monat: Monat) =>
	(!p.aktivAb || p.aktivAb <= monat) && (!p.aktivBis || p.aktivBis >= monat);

const hatStunden = (e?: StundenEintrag) => !!e && ((e.tag ?? 0) > 0 || (e.nacht ?? 0) > 0);

export type Betraege = {
	tag: number;
	nacht: number;
	stunden: number;
	taglohn: number;
	nachtlohn: number;
	brutto: number;
	/** Per deduction name */
	abzuege: Record<string, number>;
	abzuegeTotal: number;
	netto: number;
};

export type Zeile = Betraege & { person: Person; leer: boolean };

export type MonatsResultat = {
	monat: Monat;
	saetze: Saetze | null;
	zeilen: Zeile[];
	total: Betraege;
	/** At least one value entered */
	erfasst: boolean;
};

const leereBetraege = (): Betraege => ({
	tag: 0,
	nacht: 0,
	stunden: 0,
	taglohn: 0,
	nachtlohn: 0,
	brutto: 0,
	abzuege: {},
	abzuegeTotal: 0,
	netto: 0
});

function addiere(ziel: Betraege, b: Betraege) {
	ziel.tag = rappen(ziel.tag + b.tag);
	ziel.nacht = rappen(ziel.nacht + b.nacht);
	ziel.stunden = rappen(ziel.stunden + b.stunden);
	ziel.taglohn = rappen(ziel.taglohn + b.taglohn);
	ziel.nachtlohn = rappen(ziel.nachtlohn + b.nachtlohn);
	ziel.brutto = rappen(ziel.brutto + b.brutto);
	for (const [name, betrag] of Object.entries(b.abzuege)) {
		ziel.abzuege[name] = rappen((ziel.abzuege[name] ?? 0) + betrag);
	}
	ziel.abzuegeTotal = rappen(ziel.abzuegeTotal + b.abzuegeTotal);
	ziel.netto = rappen(ziel.netto + b.netto);
}

export function berechneBetraege(
	eintrag: StundenEintrag | undefined,
	saetze: Saetze | null
): Betraege {
	const tag = Math.max(0, eintrag?.tag ?? 0);
	const nacht = Math.max(0, eintrag?.nacht ?? 0);
	const taglohn = saetze ? rappen(tag * saetze.tag) : 0;
	const nachtlohn = saetze ? rappen(nacht * saetze.nacht) : 0;
	const brutto = rappen(taglohn + nachtlohn);
	const abzuege: Record<string, number> = {};
	for (const a of saetze?.abzuege ?? []) {
		abzuege[a.name] = rappen((abzuege[a.name] ?? 0) + (brutto * a.prozent) / 100);
	}
	const abzuegeTotal = rappen(Object.values(abzuege).reduce((s, v) => s + v, 0));
	return {
		tag,
		nacht,
		stunden: rappen(tag + nacht),
		taglohn,
		nachtlohn,
		brutto,
		abzuege,
		abzuegeTotal,
		netto: rappen(brutto - abzuegeTotal)
	};
}

/**
 * Rows of a month: every person active in the month, plus anybody with hours
 * in it (e.g. «aktiv bis» set later). Order of the person list.
 */
export function berechneMonat(
	config: AssistenzConfig,
	monat: Monat,
	daten: MonatsStunden | null | undefined
): MonatsResultat {
	const saetze = saetzeFuer(config, monat);
	const stunden = daten?.stunden ?? {};
	const total = leereBetraege();
	const zeilen: Zeile[] = config.personen
		.filter((p) => personAktiv(p, monat) || hatStunden(stunden[p.id]))
		.map((person) => {
			const b = berechneBetraege(stunden[person.id], saetze);
			addiere(total, b);
			return { ...b, person, leer: !hatStunden(stunden[person.id]) };
		});
	return { monat, saetze, zeilen, total, erfasst: zeilen.some((z) => !z.leer) };
}

export type JahresResultat = {
	jahr: number;
	monate: MonatsResultat[];
	/** Only persons with hours in the year */
	proPerson: { person: Person; total: Betraege }[];
	total: Betraege;
};

export function berechneJahr(
	config: AssistenzConfig,
	jahr: number,
	daten: Record<Monat, MonatsStunden | null>
): JahresResultat {
	const monate = monateDesJahres(jahr, config.jahresbeginn).map((m) =>
		berechneMonat(config, m, daten[m])
	);
	const total = leereBetraege();
	const proPerson = new Map<string, { person: Person; total: Betraege }>();
	for (const m of monate) {
		addiere(total, m.total);
		for (const z of m.zeilen) {
			if (z.leer) continue;
			const entry = proPerson.get(z.person.id) ?? { person: z.person, total: leereBetraege() };
			addiere(entry.total, z);
			proPerson.set(z.person.id, entry);
		}
	}
	// Order of the person list
	const order = new Map(config.personen.map((p, i) => [p.id, i]));
	return {
		jahr,
		monate,
		proPerson: [...proPerson.values()].sort(
			(a, b) => (order.get(a.person.id) ?? 0) - (order.get(b.person.id) ?? 0)
		),
		total
	};
}

/** All deduction names used in the given results (column order of first appearance) */
export function abzugNamen(monate: MonatsResultat[]): string[] {
	const names: string[] = [];
	for (const m of monate)
		for (const a of m.saetze?.abzuege ?? []) if (!names.includes(a.name)) names.push(a.name);
	return names;
}

/** Hours from a form value: «8,5» → 8.5; empty → undefined; invalid → NaN */
export function parseStunden(raw: unknown): number | undefined {
	const s = String(raw ?? '')
		.trim()
		.replace(',', '.');
	if (s === '') return undefined;
	const n = Number(s);
	return Number.isFinite(n) && n >= 0 && n <= 744 ? rappen(n) : NaN;
}

/** Month name for display, e.g. «September 2026» */
export const monatName = (monat: Monat, locale = 'de-CH') =>
	new Date(`${monat}-01T00:00:00Z`).toLocaleString(locale, {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});

export const fmtChf = (n: number) =>
	new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/** Hours without trailing zeros: 8 / 8.5 / 8.25 */
export const fmtStunden = (n: number) =>
	new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 }).format(n);
