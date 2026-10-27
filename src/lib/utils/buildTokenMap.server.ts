type Entry = { schluessel?: string; wert?: string; value_en?: string | null };

/**
 * Baut eine Token-Map aus dem "Variablen"-Prismic-Dokument.
 * Jeder Eintrag mit Schlüssel + Wert wird als {{Schlüssel}} → Wert Token registriert.
 * Englische Seiten (lang en-*) verwenden «Wert (EN)», falls ausgefüllt, sonst den deutschen Wert.
 */
export function buildTokenMap(vData: unknown, lang = ''): Record<string, string> {
	const tokenMap: Record<string, string> = {};
	const entries: Entry[] = (vData as any)?.eintraege ?? [];
	const english = lang.split('-')[0] === 'en';
	for (const entry of entries) {
		if (!entry.schluessel) continue;
		const value = english && entry.value_en?.trim() ? entry.value_en : entry.wert;
		if (value != null) tokenMap[entry.schluessel.trim()] = value;
	}
	return tokenMap;
}
