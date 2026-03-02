type Entry = { schluessel?: string; wert?: string };

/**
 * Baut eine Token-Map aus dem "Variablen"-Prismic-Dokument.
 * Jeder Eintrag mit Schlüssel + Wert wird als {{Schlüssel}} → Wert Token registriert.
 */
export function buildTokenMap(vData: unknown): Record<string, string> {
	const tokenMap: Record<string, string> = {};
	const entries: Entry[] = (vData as any)?.eintraege ?? [];
	for (const entry of entries) {
		if (entry.schluessel && entry.wert != null) {
			tokenMap[entry.schluessel] = entry.wert;
		}
	}
	return tokenMap;
}
