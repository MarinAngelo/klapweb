/**
 * Aufgaben-Katalog aus Prismic + Regeln für Teilaufgaben.
 *
 * Teilaufgabe = Aufgabe-Dokument mit `parent_task` → Hauptaufgabe.
 * - Hauptaufgaben mit Teilaufgaben können nicht selbst angenommen werden
 * - `max_annahmen` begrenzt die Annahmen pro Aufgabe (alle Buchungen)
 * - `enforce_order` (Hauptaufgabe): Teilaufgabe erst annehmbar, wenn alle mit kleinerer
 *   `position` mindestens einmal erledigt sind
 * - `bonus_credits` (Hauptaufgabe): hat eine Buchung alle Teilaufgaben erledigt, wird ein
 *   Bonus-Datensatz (erledigt, fest) angelegt → fliesst wie jede Aufgabe in die Abrechnung
 */
import { createClient } from '$lib/prismicio';
import {
	createAnnahmeMitId,
	deleteAnnahme,
	listAlleAnnahmen,
	listAnnahmenFuerBuchung,
	type AufgabeAnnahme
} from '$lib/server/aufgaben';

type Fetch = typeof fetch;

export interface KatalogWerkzeug {
	uid: string | null;
	titel: string;
	beschreibung: unknown;
	bild: { url: string; alt: string } | null;
}

export type Prioritaet = 'Hoch' | 'Mittel' | 'Gering';
const PRIORITAET_RANG: Record<Prioritaet, number> = { Hoch: 0, Mittel: 1, Gering: 2 };

/** Sort key: Hoch < Mittel < Gering */
export const prioritaetRang = (p: Prioritaet) => PRIORITAET_RANG[p] ?? 1;

export interface KatalogAufgabe {
	uid: string;
	titel: string;
	beschreibung: unknown;
	bild: { url: string; alt: string } | null;
	aktiv: boolean;
	prioritaet: Prioritaet;
	maxAnnahmen: number;
	creditTyp: string;
	creditBetrag: number | null;
	werkzeuge: KatalogWerkzeug[];
	parentUid: string | null;
	position: number;
	enforceOrder: boolean;
	bonusCredits: number | null;
}

export async function loadKatalog(fetch: Fetch, lang = 'de-ch'): Promise<KatalogAufgabe[]> {
	const client = createClient({ fetch });
	const docs = await client.getAllByType('aufgabe', {
		lang,
		fetchLinks: ['werkzeug.titel', 'werkzeug.beschreibung', 'werkzeug.bild']
	});

	const katalog: KatalogAufgabe[] = docs.map((doc) => {
		const d = doc.data as any;
		const werkzeuge = (d.werkzeuge ?? [])
			.map((w: any) =>
				w.werkzeug?.data
					? {
							uid: w.werkzeug.uid ?? null,
							titel: w.werkzeug.data.titel ?? '',
							beschreibung: w.werkzeug.data.beschreibung ?? null,
							bild: w.werkzeug.data.bild?.url
								? { url: w.werkzeug.data.bild.url, alt: w.werkzeug.data.bild.alt ?? '' }
								: null
						}
					: null
			)
			.filter(Boolean);
		const parentUid =
			d.parent_task?.uid && d.parent_task.uid !== doc.uid ? d.parent_task.uid : null;
		return {
			uid: doc.uid ?? doc.id,
			titel: d.titel ?? '',
			beschreibung: d.beschreibung ?? null,
			bild: d.bild?.url ? { url: d.bild.url, alt: d.bild.alt ?? '' } : null,
			aktiv: d.aktiv !== false,
			prioritaet: (d.priority in PRIORITAET_RANG ? d.priority : 'Mittel') as Prioritaet,
			maxAnnahmen: d.max_annahmen ?? 0,
			creditTyp: d.credit_typ ?? 'Fest',
			creditBetrag: d.credit_betrag ?? null,
			werkzeuge,
			parentUid,
			position: d.position ?? 0,
			enforceOrder: d.enforce_order === true,
			bonusCredits: d.bonus_credits ?? null
		};
	});

	// Subtasks of an inactive or missing main task are hidden as well
	const byUid = new Map(katalog.map((a) => [a.uid, a]));
	for (const a of katalog) {
		if (!a.parentUid) continue;
		const parent = byUid.get(a.parentUid);
		if (!parent) a.parentUid = null;
		else if (!parent.aktiv) a.aktiv = false;
	}
	return katalog;
}

/** Active subtasks of a main task, sorted by position. */
export function teilaufgaben(katalog: KatalogAufgabe[], parentUid: string): KatalogAufgabe[] {
	return katalog
		.filter((a) => a.parentUid === parentUid && a.aktiv)
		.sort((a, b) => a.position - b.position || a.titel.localeCompare(b.titel));
}

export interface AufgabeStatus {
	annahmen: number;
	erledigt: number;
}

/** Number of acceptances / completed acceptances per task uid (bonus records excluded). */
export function statusProAufgabe(annahmen: AufgabeAnnahme[]): Map<string, AufgabeStatus> {
	const map = new Map<string, AufgabeStatus>();
	for (const a of annahmen) {
		if (a.bonus) continue;
		const s = map.get(a.aufgabeUid) ?? { annahmen: 0, erledigt: 0 };
		s.annahmen++;
		if (a.status === 'erledigt') s.erledigt++;
		map.set(a.aufgabeUid, s);
	}
	return map;
}

/** Subtasks that must be completed before `aufgabe` can be accepted (enforce_order). */
export function offeneVorgaenger(
	aufgabe: KatalogAufgabe,
	katalog: KatalogAufgabe[],
	status: Map<string, AufgabeStatus>
): KatalogAufgabe[] {
	if (!aufgabe.parentUid) return [];
	const parent = katalog.find((a) => a.uid === aufgabe.parentUid);
	if (!parent?.enforceOrder) return [];
	return teilaufgaben(katalog, parent.uid).filter(
		(t) => t.position < aufgabe.position && !(status.get(t.uid)?.erledigt ?? 0)
	);
}

/** Returns an error message if the booking may not accept the task, otherwise null. */
export function annahmeFehler(
	aufgabeUid: string,
	buchungId: string,
	katalog: KatalogAufgabe[],
	alleAnnahmen: AufgabeAnnahme[]
): string | null {
	const aufgabe = katalog.find((a) => a.uid === aufgabeUid);
	if (!aufgabe || !aufgabe.aktiv) return 'Aufgabe nicht verfügbar';
	if (teilaufgaben(katalog, aufgabe.uid).length > 0) return 'Bitte eine der Teilaufgaben annehmen';

	const eigeneOffen = alleAnnahmen.some(
		(a) => a.buchungId === buchungId && a.aufgabeUid === aufgabeUid && a.status !== 'erledigt'
	);
	if (eigeneOffen) return 'Aufgabe ist bereits angenommen';

	const status = statusProAufgabe(alleAnnahmen);
	if (aufgabe.maxAnnahmen > 0 && (status.get(aufgabeUid)?.annahmen ?? 0) >= aufgabe.maxAnnahmen)
		return 'Aufgabe ist bereits vergeben';

	if (offeneVorgaenger(aufgabe, katalog, status).length > 0)
		return 'Vorherige Teilaufgaben müssen zuerst erledigt sein';

	return null;
}

const bonusId = (buchungId: string, hauptaufgabeUid: string) =>
	`buchung_${buchungId}/bonus_${hauptaufgabeUid}`;

/** After a subtask is completed: grant the main task's bonus if the booking did all subtasks. */
export async function bonusPruefen(annahme: AufgabeAnnahme, fetch: Fetch): Promise<void> {
	if (!annahme.hauptaufgabeUid || annahme.bonus) return;
	try {
		const katalog = await loadKatalog(fetch);
		const parent = katalog.find((a) => a.uid === annahme.hauptaufgabeUid);
		if (!parent?.bonusCredits || parent.bonusCredits <= 0) return;

		const teile = teilaufgaben(katalog, parent.uid);
		if (teile.length === 0) return;

		const eigene = await listAnnahmenFuerBuchung(annahme.buchungId);
		const erledigt = new Set(
			eigene.filter((a) => a.status === 'erledigt' && !a.bonus).map((a) => a.aufgabeUid)
		);
		if (!teile.every((t) => erledigt.has(t.uid))) return;

		const now = new Date().toISOString();
		await createAnnahmeMitId({
			id: bonusId(annahme.buchungId, parent.uid),
			aufgabeUid: parent.uid,
			aufgabeTitel: `Bonus: ${parent.titel}`,
			buchungId: annahme.buchungId,
			ressourceUid: annahme.ressourceUid,
			name: annahme.name,
			email: annahme.email,
			status: 'erledigt',
			creditTyp: 'fest',
			creditBetrag: parent.bonusCredits,
			credits: parent.bonusCredits,
			bonus: true,
			angenommenAt: now,
			erledigtAt: now
		});
	} catch (e) {
		console.error('Bonus-Prüfung fehlgeschlagen:', e);
	}
}

/** A subtask is no longer completed (reset/deleted): withdraw the bonus of its main task. */
export async function bonusEntfernen(annahme: AufgabeAnnahme): Promise<void> {
	if (!annahme.hauptaufgabeUid || annahme.bonus) return;
	await deleteAnnahme(bonusId(annahme.buchungId, annahme.hauptaufgabeUid)).catch(() => null);
}

/** Public list for the slice: active tasks incl. subtask info and availability counters. */
export async function katalogMitStatus(fetch: Fetch, lang: string) {
	const katalog = await loadKatalog(fetch, lang);
	let status = new Map<string, AufgabeStatus>();
	try {
		status = statusProAufgabe(await listAlleAnnahmen());
	} catch {
		/* blobs unavailable — show tasks without counters */
	}

	return katalog
		.filter((a) => a.aktiv)
		.sort((a, b) => prioritaetRang(a.prioritaet) - prioritaetRang(b.prioritaet))
		.map((a) => {
			const s = status.get(a.uid) ?? { annahmen: 0, erledigt: 0 };
			return {
				uid: a.uid,
				titel: a.titel,
				beschreibung: a.beschreibung,
				bild: a.bild,
				aktiv: a.aktiv,
				prioritaet: a.prioritaet,
				max_annahmen: a.maxAnnahmen,
				credit_typ: a.creditTyp,
				credit_betrag: a.creditBetrag,
				werkzeuge: a.werkzeuge,
				parent_uid: a.parentUid,
				position: a.position,
				enforce_order: a.enforceOrder,
				bonus_credits: a.bonusCredits,
				erledigt: s.erledigt > 0,
				vergeben: a.maxAnnahmen > 0 && s.annahmen >= a.maxAnnahmen,
				gesperrt_durch: offeneVorgaenger(a, katalog, status).map((t) => t.titel)
			};
		});
}
