type Entry = { schluessel?: string; wert?: string; waehrung?: string };
type CurrencyEntry = { code?: string; nachkommastellen?: number };
type PaymentSplit = { suffix?: string; prozent?: number };

const EU_COUNTRIES = new Set([
	'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU',
	'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
]);

export async function buildTokenMap(
	vData: any,
	fetchFn: typeof fetch,
	request: Request
): Promise<Record<string, string>> {
	const tokenMap: Record<string, string> = {};
	const entries: Entry[] = vData?.eintraege ?? [];

	// Pass 1: collect raw numeric values for direct entries
	const rawEntryValues: Record<string, number> = {};
	for (const entry of entries) {
		if (!entry.schluessel || entry.wert == null) continue;
		const n = parseFloat(entry.wert);
		if (!isNaN(n)) rawEntryValues[entry.schluessel] = n;
	}

	// Pass 2: evaluate formula entries
	// Syntax: "PreisA+30%" = +30%, "PreisA-20%" = -20%, "PreisA*30%" = 30% of PreisA
	for (const entry of entries) {
		if (!entry.schluessel || entry.wert == null) continue;
		const m = entry.wert.trim().match(/^(\w+)([+\-\*])([\d.]+)%$/);
		if (!m) continue;
		const base = rawEntryValues[m[1]];
		if (base == null) continue;
		const factor = parseFloat(m[3]) / 100;
		rawEntryValues[entry.schluessel] =
			m[2] === '+' ? base * (1 + factor) :
			m[2] === '-' ? base * (1 - factor) :
			base * factor;
	}

	// Build initial tokenMap: formula entries get computed value, others as-is
	for (const entry of entries) {
		if (!entry.schluessel || entry.wert == null) continue;
		const isFormula = /^(\w+)[+\-\*][\d.]+%$/.test(entry.wert.trim());
		tokenMap[entry.schluessel] =
			isFormula && rawEntryValues[entry.schluessel] != null
				? String(rawEntryValues[entry.schluessel])
				: entry.wert;
	}

	// Fetch live exchange rates
	const baseCurrency: string = vData?.basis_waehrung ?? '';
	const currencyEntries: CurrencyEntry[] = vData?.waehrungen ?? [];
	const rawRates: Record<string, number> = {};

	if (baseCurrency && currencyEntries.length > 0) {
		try {
			const ratesRes = await fetchFn(`https://open.er-api.com/v6/latest/${baseCurrency}`);
			if (ratesRes.ok) {
				const ratesData = await ratesRes.json();
				rawRates[baseCurrency] = 1;
				for (const entry of currencyEntries) {
					const code = entry.code?.toUpperCase();
					if (!code) continue;
					const rate: number | undefined = ratesData.rates?.[code];
					if (rate != null) {
						rawRates[code] = rate;
						const decimals = entry.nachkommastellen ?? 4;
						tokenMap[code] = parseFloat(rate.toFixed(decimals)).toString();
					}
				}
			}
		} catch {
			// Live rates unavailable – tokens remain unresolved
		}
	}

	if (Object.keys(rawRates).length === 0) return tokenMap;

	// Auto-generate currency-converted price tokens: {{PreisA_USD}}, {{PreisA_EUR}}, ...
	for (const entry of entries) {
		if (!entry.schluessel || !entry.waehrung) continue;
		const srcCurrency = entry.waehrung.toUpperCase();
		const srcRate = rawRates[srcCurrency];
		if (srcRate == null) continue;
		const numericValue = rawEntryValues[entry.schluessel];
		if (numericValue == null || isNaN(numericValue)) continue;

		for (const [tgtCurrency, tgtRate] of Object.entries(rawRates)) {
			const converted = numericValue * (tgtRate / srcRate);
			const decimals =
				currencyEntries.find((c) => c.code?.toUpperCase() === tgtCurrency)?.nachkommastellen ?? 2;
			tokenMap[`${entry.schluessel}_${tgtCurrency}`] = `${tgtCurrency} ${converted.toFixed(decimals)}`;
		}
	}

	// Auto-generate payment split tokens for all price entries (e.g. {{Preis_anz}}, {{Preis_restz}})
	const paymentSplits: PaymentSplit[] = vData?.zahlungsplan ?? [];
	for (const entry of entries) {
		if (!entry.schluessel || !entry.waehrung) continue;
		const numericValue = rawEntryValues[entry.schluessel];
		if (numericValue == null) continue;
		const srcCurrency = entry.waehrung.toUpperCase();
		const srcRate = rawRates[srcCurrency];
		if (srcRate == null) continue;

		for (const split of paymentSplits) {
			if (!split.suffix || split.prozent == null) continue;
			const splitKey = `${entry.schluessel}_${split.suffix}`;
			const splitValue = numericValue * (split.prozent / 100);

			for (const [tgtCurrency, tgtRate] of Object.entries(rawRates)) {
				const converted = splitValue * (tgtRate / srcRate);
				const decimals =
					currencyEntries.find((c) => c.code?.toUpperCase() === tgtCurrency)?.nachkommastellen ?? 2;
				tokenMap[`${splitKey}_${tgtCurrency}`] = `${tgtCurrency} ${converted.toFixed(decimals)}`;
			}
			tokenMap[splitKey] =
				tokenMap[`${splitKey}_${baseCurrency}`] ?? `${baseCurrency} ${splitValue.toFixed(2)}`;
		}
	}

	// Geo-based currency override: overwrite base tokens with visitor's local currency (server-side)
	const country = request.headers.get('x-country')?.toUpperCase() ?? '';
	const geoCurrency =
		country === 'CH' || country === '' ? 'CHF' : EU_COUNTRIES.has(country) ? 'EUR' : 'USD';
	for (const entry of entries) {
		if (!entry.schluessel || !entry.waehrung) continue;
		const geoToken = tokenMap[`${entry.schluessel}_${geoCurrency}`];
		if (geoToken != null) tokenMap[entry.schluessel] = geoToken;
	}

	return tokenMap;
}
