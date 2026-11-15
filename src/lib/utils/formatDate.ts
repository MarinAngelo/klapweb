/**
 * Datums-Formatierungshelfer für das gesamte Projekt.
 *
 * Alle Funktionen verwenden 'de-CH' als Standardlocale und sind UTC-sicher
 * für Datumsstrings im Format YYYY-MM-DD (Buchungen, Slots).
 *
 * Verwendung:
 *   import { formatDateShort, formatEventDateRange, ... } from '$lib/utils/formatDate';
 *
 * Funktionsübersicht:
 *   formatDateShort         – "05.08.2026"         (YYYY-MM-DD → DD.MM.YYYY)
 *   formatDateWithWeekday   – "Mo., 05.08.2026"    (Buchungs-/Slot-Kontext, UTC-sicher)
 *   formatEventDateTime     – "5. August 2026"     (Veranstaltungs-Slices, optional mit Uhrzeit)
 *   formatEventDateRange    – "2. bis 4. Aug 2026" (Kompakt-Bereich für mehrtägige Events)
 *   formatDateTimeShort     – "05.08.2026, 14:00"  (Admin-Interfaces)
 */

/**
 * Time zone of the websites: Prismic stores date+time fields (Timestamp) in UTC; they are
 * always shown in Swiss time — independent of the server (UTC on Netlify) and the visitor.
 */
export const SITE_TIME_ZONE = 'Europe/Zurich';

/**
 * Local date + time in a time zone → UTC milliseconds (correct across daylight saving changes).
 * "2026-07-10", "10:00", "Europe/Zurich" → 2026-07-10T08:00:00Z
 */
export function zonedTimeToUtc(datum: string, uhrzeit: string, timeZone = SITE_TIME_ZONE): number {
	const [y, mo, d] = datum.split('-').map(Number);
	const [h, mi] = uhrzeit.split(':').map(Number);
	const wallClock = Date.UTC(y, mo - 1, d, h, mi);
	// Offset of the zone at a given instant (zone wall clock minus UTC)
	const offsetAt = (ms: number) => {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone,
			hourCycle: 'h23',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric'
		}).formatToParts(new Date(ms));
		const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
		return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute')) - ms;
	};
	// Two passes: the offset can differ between the guess and the result (DST change)
	const first = wallClock - offsetAt(wallClock);
	return wallClock - offsetAt(first);
}

/** Calendar day of an instant in SITE_TIME_ZONE */
function zonedDay(d: Date): { year: number; month: number; day: number } {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: SITE_TIME_ZONE,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric'
	}).formatToParts(d);
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
	return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * Eingabe: "2026-08-05" → Ausgabe: "05.08.2026"
 * Verwendet reinen String-Split (kein Date-Objekt) → keine Timezone-Probleme.
 * Verwendung: RessourceBuchung-Slice, admin/rechnungen, api/test-reminder
 */
export function formatDateShort(dateStr: string | null | undefined): string {
	if (!dateStr) return '';
	const parts = dateStr.split('-');
	if (parts.length < 3) return dateStr;
	return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

/**
 * Für Buchungs- und Slot-Kontexte. Fügt mittags UTC hinzu (T12:00:00Z)
 * damit YYYY-MM-DD-Strings timezone-sicher bleiben.
 * Eingabe: "2026-10-02", "14:00" → Ausgabe: "Fr., 02.10.2026, 14:00"
 * Eingabe: "2026-10-02", null, 'de-CH', 'long' → Ausgabe: "Freitag, 02.10.2026"
 * Verwendung: admin/buchungen, konto, terminSlots, api/buche-termin,
 *             api/bestaetige-buchung, admin/ressource-buchungen
 */
export function formatDateWithWeekday(
	dateStr: string | null | undefined,
	uhrzeit?: string | null,
	locale = 'de-CH',
	weekday: 'short' | 'long' = 'short'
): string {
	if (!dateStr) return '–';
	const d = new Date(dateStr + 'T12:00:00Z');
	if (isNaN(d.getTime())) return '–';
	const formatted = d.toLocaleDateString(locale, {
		weekday,
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: 'UTC'
	});
	return uhrzeit ? `${formatted}, ${uhrzeit}` : formatted;
}

/**
 * Für Event-Slices (GlobaleEvents, Event). Prismic-Timestamps sind UTC → Anzeige in
 * SITE_TIME_ZONE (Schweizer Zeit).
 * allDay=true:  "2. Oktober 2026"
 * allDay=false: "2. Oktober 2026, 14:00"
 * Verwendung: GlobaleEvents (Anmeldetext), Event-Slice
 */
export function formatEventDateTime(
	ts: string | null | undefined,
	allDay: boolean,
	locale = 'de-CH'
): string {
	if (!ts) return '';
	const d = new Date(ts);
	if (isNaN(d.getTime())) return '';
	const timeZone = SITE_TIME_ZONE;
	if (allDay) {
		return d.toLocaleDateString(locale, {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone
		});
	}
	return (
		d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone }) +
		', ' +
		d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone })
	);
}

/**
 * Kompakter Datumsbereich für mehrtägige Events. Vermeidet Wiederholungen
 * von Monat/Jahr wenn möglich.
 *   Gleicher Monat+Jahr:  "2. bis 4. Oktober 2026"
 *   Gleich. Jahr, diff. Monat: "2. Oktober bis 4. November 2026"
 *   Versch. Jahre:        "31. Dezember 2025 bis 2. Januar 2026"
 *   Einzelner Tag:        "2. Oktober 2026" (bzw. mit Uhrzeit wenn !allDay)
 *
 * @param conjunction  Übersetztes Wort für "bis" — aus dem i18n-Store übergeben:
 *                     formatEventDateRange(start, end, allDay, locale, $_('bis'))
 * Verwendung: GlobaleEvents-Slice
 */
export function formatEventDateRange(
	startTs: string | null | undefined,
	endTs: string | null | undefined,
	allDay: boolean,
	locale = 'de-CH',
	conjunction = 'bis'
): string {
	if (!startTs) return '';
	const start = new Date(startTs);
	const end = endTs ? new Date(endTs) : null;
	if (isNaN(start.getTime())) return '';

	const fullOpts: Intl.DateTimeFormatOptions = allDay
		? { day: 'numeric', month: 'long', year: 'numeric' }
		: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
	const timeZone = SITE_TIME_ZONE;
	const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => {
		if ('hour' in opts) {
			const { hour, minute, ...dateOpts } = opts;
			return `${d.toLocaleDateString(locale, { ...dateOpts, timeZone })}, ${d.toLocaleTimeString(locale, { hour, minute, timeZone })}`;
		}
		return d.toLocaleDateString(locale, { ...opts, timeZone });
	};

	if (!end || isNaN(end.getTime())) return fmt(start, fullOpts);

	const s = zonedDay(start);
	const e = zonedDay(end);
	const sameDay = s.year === e.year && s.month === e.month && s.day === e.day;
	if (sameDay) return fmt(start, fullOpts);

	if (!allDay) {
		return `${fmt(start, fullOpts)} ${conjunction} ${fmt(end, fullOpts)}`;
	}

	const sameMonth = s.month === e.month;
	const sameYear = s.year === e.year;

	if (sameMonth && sameYear) {
		return `${s.day}. ${conjunction} ${e.day}. ${fmt(end, { month: 'long', year: 'numeric' })}`;
	} else if (sameYear) {
		return `${fmt(start, { day: 'numeric', month: 'long' })} ${conjunction} ${fmt(end, { day: 'numeric', month: 'long' })} ${e.year}`;
	} else {
		return `${fmt(start, fullOpts)} ${conjunction} ${fmt(end, fullOpts)}`;
	}
}

/**
 * Eingabe: ISO-String "2026-08-05T14:00:00Z" → Ausgabe: "05.08.2026, 14:00"
 * Verwendung: admin/aufgaben, performance-report
 */
export function formatDateTimeShort(ts: string | null | undefined, locale = 'de-CH'): string {
	if (!ts) return '';
	const d = new Date(ts);
	if (isNaN(d.getTime())) return '';
	return d.toLocaleString(locale, {
		timeZone: SITE_TIME_ZONE,
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
