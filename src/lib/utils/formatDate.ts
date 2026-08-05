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
 * Für Event-Slices (GlobaleEvents, Event). Kein UTC-Offset, da Prismic-Timestamps
 * bereits die korrekte Ortszeit enthalten.
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
	if (allDay) {
		return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
	}
	return d.toLocaleDateString(locale, {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
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
	const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString(locale, opts);

	if (!end || isNaN(end.getTime())) return fmt(start, fullOpts);

	const sameDay =
		start.getFullYear() === end.getFullYear() &&
		start.getMonth() === end.getMonth() &&
		start.getDate() === end.getDate();
	if (sameDay) return fmt(start, fullOpts);

	if (!allDay) {
		return `${fmt(start, fullOpts)} ${conjunction} ${fmt(end, fullOpts)}`;
	}

	const sameMonth = start.getMonth() === end.getMonth();
	const sameYear = start.getFullYear() === end.getFullYear();

	if (sameMonth && sameYear) {
		return `${start.getDate()}. ${conjunction} ${end.getDate()}. ${fmt(end, { month: 'long', year: 'numeric' })}`;
	} else if (sameYear) {
		return `${fmt(start, { day: 'numeric', month: 'long' })} ${conjunction} ${fmt(end, { day: 'numeric', month: 'long' })} ${end.getFullYear()}`;
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
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
