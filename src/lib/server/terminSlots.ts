/**
 * Shared logic for expanding terminplanung docs into individual bookable slots.
 * Used by /api/termine and /admin/buchungen.
 */

export interface TerminSlot {
	id: string;
	baseUid: string;
	titel: string;
	datum: string;
	uhrzeit: string;
	sessionLaenge: number | null;
	zeitzone: string;
	label: string;
}

function makeLabel(datum: string, uhrzeit: string, titel: string, sessionLaenge: number | null): string {
	if (!datum) return titel;
	const date = new Date(datum + 'T12:00:00Z');
	const formatted = date.toLocaleDateString('de-CH', {
		weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
	});
	let label = formatted;
	if (uhrzeit) label += `, ${uhrzeit}`;
	if (titel) label += ` – ${titel}`;
	if (sessionLaenge) label += ` (${sessionLaenge} min)`;
	return label;
}

function advanceDate(date: Date, wiederholung: string): Date {
	const next = new Date(date);
	if (wiederholung === 'Täglich') next.setUTCDate(next.getUTCDate() + 1);
	else if (wiederholung === 'Wöchentlich') next.setUTCDate(next.getUTCDate() + 7);
	else if (wiederholung === 'Zweiwöchentlich') next.setUTCDate(next.getUTCDate() + 14);
	else if (wiederholung === 'Monatlich') next.setUTCMonth(next.getUTCMonth() + 1);
	return next;
}

export function expandDoc(doc: any, fromDate: string): TerminSlot[] {
	const d = doc.data as any;
	const startDatum: string = d.datum ?? '';
	if (!startDatum) return [];

	const titel: string = d.titel ?? doc.uid;
	const uhrzeit: string = d.uhrzeit ?? '';
	const sessionLaenge: number | null = d.session_laenge ?? null;
	const zeitzone: string = d.zeitzone ?? 'Europe/Zurich';
	const wiederholung: string = d.wiederholung ?? 'Keine';

	if (!wiederholung || wiederholung === 'Keine') {
		if (startDatum < fromDate) return [];
		return [{
			id: doc.uid,
			baseUid: doc.uid,
			titel,
			datum: startDatum,
			uhrzeit,
			sessionLaenge,
			zeitzone,
			label: makeLabel(startDatum, uhrzeit, titel, sessionLaenge)
		}];
	}

	const bis: string | null = d.wiederholung_bis ?? null;
	const anzahl: number | null = d.wiederholung_anzahl ?? null;

	const slots: TerminSlot[] = [];
	let current = new Date(startDatum + 'T12:00:00Z');
	let totalCount = 0;
	const hardLimit = 500;

	while (totalCount < hardLimit) {
		const dateStr = current.toISOString().slice(0, 10);
		if (bis && dateStr > bis) break;
		if (anzahl !== null && totalCount >= anzahl) break;

		if (dateStr >= fromDate) {
			slots.push({
				id: `${doc.uid}_${dateStr}`,
				baseUid: doc.uid,
				titel,
				datum: dateStr,
				uhrzeit,
				sessionLaenge,
				zeitzone,
				label: makeLabel(dateStr, uhrzeit, titel, sessionLaenge)
			});
		}

		totalCount++;
		current = advanceDate(current, wiederholung);
	}

	return slots;
}
