/**
 * Fetches exchange rates from open.er-api.com relative to a base currency.
 * Returns a map of currency code → rate (how many units of that currency per 1 base unit).
 * Returns empty object on failure (caller should handle gracefully).
 */
export async function fetchExchangeRates(
	baseCurrency: string,
	targetCodes: string[]
): Promise<Record<string, number>> {
	if (!targetCodes.length) return {};
	try {
		const resp = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
		if (!resp.ok) return {};
		const data = await resp.json();
		const allRates: Record<string, number> = data.rates ?? {};
		const result: Record<string, number> = {};
		for (const code of targetCodes) {
			if (allRates[code] != null) result[code] = allRates[code];
		}
		return result;
	} catch {
		return {};
	}
}
