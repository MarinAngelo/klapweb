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
	endzeit?: string;
	sessionLaenge: number | null;
	zeitzone: string;
	label: string;
	arbeitstagId?: string;
	angebotId?: string;
}

import { formatDateWithWeekday } from '$lib/utils/formatDate';

function makeLabel(
	datum: string,
	uhrzeit: string,
	titel: string,
	sessionLaenge: number | null,
	endzeit?: string
): string {
	if (!datum) return titel;
	const formatted = formatDateWithWeekday(datum, uhrzeit || null);
	let label = formatted;
	if (titel) label += ` – ${titel}`;
	if (sessionLaenge) label += ` (${sessionLaenge} min${endzeit ? `, bis ${endzeit}` : ''})`;
	return label;
}

function minutes(value: string): number | null {
	const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? '');
	if (!match) return null;
	const result = Number(match[1]) * 60 + Number(match[2]);
	return result >= 0 && result < 24 * 60 ? result : null;
}

function timeLabel(value: number): string {
	return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function linkUid(link: any): string {
	return link?.uid ?? link?.id ?? '';
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
		return [
			{
				id: doc.uid,
				baseUid: doc.uid,
				titel,
				datum: startDatum,
				uhrzeit,
				endzeit:
					sessionLaenge && uhrzeit ? timeLabel((minutes(uhrzeit) ?? 0) + sessionLaenge) : undefined,
				sessionLaenge,
				zeitzone,
				label: makeLabel(startDatum, uhrzeit, titel, sessionLaenge)
			}
		];
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
				endzeit:
					sessionLaenge && uhrzeit ? timeLabel((minutes(uhrzeit) ?? 0) + sessionLaenge) : undefined,
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

export function expandArbeitstag(doc: any, offers: any[], fromDate: string): TerminSlot[] {
	const d = doc.data as any;
	const startDatum: string = d.datum ?? '';
	const start = minutes(d.startzeit ?? '');
	const end = minutes(d.endzeit ?? '');
	if (!startDatum || start === null || end === null || end <= start) return [];

	const interval = Math.max(1, Number(d.buchungsintervall ?? 30));
	const pauseStart = minutes(d.pause_von ?? '');
	const pauseEnd = minutes(d.pause_bis ?? '');
	const offerByUid = new Map(offers.map((offer) => [offer.uid, offer]));
	const configuredOffers = (d.angebote ?? [])
		.map((entry: any) => offerByUid.get(linkUid(entry.angebot)))
		.filter((offer: any) => offer && offer.data?.aktiv !== false);
	if (configuredOffers.length === 0) return [];

	const repeat = d.wiederholung ?? 'Keine';
	const until: string | null = d.wiederholung_bis ?? null;
	const count: number | null = d.wiederholung_anzahl ?? null;
	const slots: TerminSlot[] = [];
	let current = new Date(startDatum + 'T12:00:00Z');
	let occurrence = 0;

	while (occurrence < 500) {
		const dateStr = current.toISOString().slice(0, 10);
		if (until && dateStr > until) break;
		if (count !== null && occurrence >= count) break;

		if (dateStr >= fromDate) {
			for (const offer of configuredOffers) {
				const offerData = offer.data as any;
				const duration = Number(offerData.dauer ?? 0);
				const buffer = Math.max(0, Number(offerData.puffer_danach ?? 0));
				if (duration <= 0) continue;

				for (let slotStart = start; slotStart + duration + buffer <= end; slotStart += interval) {
					const slotEnd = slotStart + duration + buffer;
					if (
						pauseStart !== null &&
						pauseEnd !== null &&
						slotStart < pauseEnd &&
						slotEnd > pauseStart
					)
						continue;
					const time = timeLabel(slotStart);
					const endTime = timeLabel(slotStart + duration);
					const title = offerData.titel ?? offer.uid;
					slots.push({
						id: `${doc.uid}_${dateStr}_${offer.uid}_${time.replace(':', '')}`,
						baseUid: doc.uid,
						titel: title,
						datum: dateStr,
						uhrzeit: time,
						endzeit: endTime,
						sessionLaenge: duration,
						zeitzone: d.zeitzone ?? 'Europe/Zurich',
						label: makeLabel(dateStr, time, title, duration, endTime),
						arbeitstagId: doc.uid,
						angebotId: offer.uid
					});
				}
			}
		}

		occurrence++;
		if (repeat === 'Keine') break;
		current = advanceDate(current, repeat);
	}

	return slots;
}
