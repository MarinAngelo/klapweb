// Explicit EU timezone set: excludes UK, Russia, Turkey, Ukraine etc.
// Includes Cyprus (Asia/Nicosia) which is EU but not Europe/* prefix.
const EU_TZ = new Set([
	'Europe/Vienna', 'Europe/Brussels', 'Europe/Sofia', 'Asia/Nicosia',
	'Europe/Prague', 'Europe/Copenhagen', 'Europe/Tallinn', 'Europe/Helsinki',
	'Europe/Paris', 'Europe/Berlin', 'Europe/Athens', 'Europe/Zagreb',
	'Europe/Budapest', 'Europe/Dublin', 'Europe/Rome', 'Europe/Riga',
	'Europe/Vilnius', 'Europe/Luxembourg', 'Europe/Malta', 'Europe/Amsterdam',
	'Europe/Warsaw', 'Europe/Lisbon', 'Europe/Bucharest', 'Europe/Bratislava',
	'Europe/Ljubljana', 'Europe/Madrid', 'Europe/Stockholm'
]);

/**
 * Detects geo currency from browser timezone and overrides base price tokens.
 * Call inside onMount – uses Intl API (browser only).
 * Matches KEY_CCC tokens and sets KEY = KEY_geoCurrency.
 */
export function applyGeoOverride(vars: Record<string, string>): Record<string, string> {
	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const geoCurrency =
		tz === 'Europe/Zurich' || tz === 'Europe/Vaduz'
			? 'CHF'
			: EU_TZ.has(tz)
				? 'EUR'
				: 'USD';

	const updated = { ...vars };
	for (const key of Object.keys(vars)) {
		const m = key.match(/^(.+)_([A-Z]{3})$/);
		if (m && m[2] === geoCurrency) {
			updated[m[1]] = vars[key];
		}
	}
	return updated;
}
