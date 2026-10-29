/**
 * Kurzzeit-Cache für GET /api/termine.
 *
 * Der Endpoint lädt pro Aufruf 2 Prismic-Typen (arbeitstag, angebot) und
 * 2 Blobs-Listen (buchungen, cancelled) — in Dev ~1,5 s Latenz. Das Ergebnis
 * ändert sich nur bei Buchung, Storno oder Admin-Aktion (sperren/entsperren/
 * löschen). Daher: Cache mit TTL + expliziter Invalidierung bei genau diesen
 * Änderungen.
 *
 * Läuft pro Server-Prozess (Netlify Function-Instanz). Im Worst Case sieht ein
 * Client für max. TTL Sekunden einen Slot als frei, der gerade gebucht wurde —
 * die Buchung selbst bleibt geschützt, weil /api/buche-termin atomar gegen
 * Blobs prüft (isBooked/isCancelled) und mit 409 ablehnt.
 */

interface TermineCacheEntry {
	data: unknown;
	at: number;
}

let _cache: TermineCacheEntry | null = null;
const TTL_MS = 30 * 1000; // 30 Sekunden

export function getCachedTermine(): unknown | null {
	if (!_cache) return null;
	if (Date.now() - _cache.at > TTL_MS) {
		_cache = null;
		return null;
	}
	return _cache.data;
}

export function setCachedTermine(data: unknown): void {
	_cache = { data, at: Date.now() };
}

/** Bei jeder Änderung an Buchungen/Sperrungen aufrufen. */
export function invalidateTermineCache(): void {
	_cache = null;
}
