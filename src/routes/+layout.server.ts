import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = 'auto';

/** @type {import('./$types').LayoutServerLoad} */
const EU_COUNTRIES = new Set([
	'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU',
	'IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'
]);

export async function load({ params, fetch, cookies, url, request }) {
	const client = createClient({ fetch, cookies });

	try {
		// 1. Repo-Infos (Master-Ermittlung)
		const repo = await client.getRepository();
		const technicalMaster =
			repo.languages.find((l) => l.is_master === true)?.id || repo.languages[0].id;
		const allLocales = repo.languages.map((l) => l.id);
		const mainLang = technicalMaster;

		// 2. Basis-Settings laden (vom Master)
		const baseSettings = await client.getSingle('settings', { lang: mainLang }).catch(() => null);

		if (!baseSettings) {
			throw error(
				404,
				`Kritisches Dokument fehlt: Bitte erstelle das Dokument 'Settings' für die Hauptsprache '${mainLang}' in Prismic.`
			);
		}

		// 3. Multilang-Check
		const isMultilangActive = baseSettings.data?.show_language_switcher ?? false;

		// 4. Sprach-Ermittlung der aktuellen Route
		const segments = url.pathname.split('/').filter(Boolean);
		const firstSegment = segments[0];
		let lang = allLocales.includes(firstSegment) ? firstSegment : params.lang || mainLang;

		// 5. Schutz-Mauer (Falls Multilang deaktiviert)
		if (!isMultilangActive && lang !== mainLang) {
			throw error(404, `Sprache '${lang}' ist zurzeit deaktiviert.`);
		}

		// 6. Paralleles Laden der globalen Daten mit klaren Fehlermeldungen
		const [settings, navigation, theme, fonts, variablenDoc] = await Promise.all([
			// Aktuelle Settings (müssen für jede Sprache existieren)
			client.getSingle('settings', { lang }).catch(() => {
				throw error(
					404,
					`Übersetzung fehlt: Bitte erstelle das Dokument 'Settings' für die Sprache '${lang}'.`
				);
			}),

			// Navigation (muss für jede Sprache existieren)
			client.getSingle('navigation', { lang }).catch(() => {
				throw error(
					404,
					`Übersetzung fehlt: Bitte erstelle das Dokument 'Navigation' für die Sprache '${lang}'.`
				);
			}),

			// Theme & Fonts (Global)
			client.getSingle('theme', { lang: '*' }).catch(() => null),
			client.getAllByType('font').catch(() => []),

			// Variablen & Preise (Global, optional) — cast: type generated after Prismic push
			(client as any).getSingle('variablen', { lang: '*' }).catch(() => null)
		]);

		// Build token map from manual entries
		const tokenMap: Record<string, string> = {};
		const vData = (variablenDoc as any)?.data;
		const entries: { schluessel?: string; wert?: string; waehrung?: string }[] =
			vData?.eintraege ?? [];
		for (const entry of entries) {
			if (entry.schluessel && entry.wert != null) {
				tokenMap[entry.schluessel] = entry.wert;
			}
		}

		// Fetch live exchange rates if currencies are configured
		const baseCurrency: string = vData?.basis_waehrung ?? '';
		const currencyEntries: { code?: string; nachkommastellen?: number }[] =
			vData?.waehrungen ?? [];

		// Raw rates from API: how many of currency X per 1 unit of baseCurrency
		const rawRates: Record<string, number> = {};

		if (baseCurrency && currencyEntries.length > 0) {
			try {
				const ratesRes = await fetch(
					`https://open.er-api.com/v6/latest/${baseCurrency}`
				);
				if (ratesRes.ok) {
					const ratesData = await ratesRes.json();
					// Add base currency itself (rate = 1)
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

		// Auto-generate converted price tokens: {{PreisA_USD}}, {{PreisA_EUR}}, ...
		// For each entry with a waehrung, compute cross-rates to all known currencies.
		// Formula: price_in_Y = price_in_X * (rawRates[Y] / rawRates[X])
		if (Object.keys(rawRates).length > 0) {
			for (const entry of entries) {
				if (!entry.schluessel || entry.wert == null || !entry.waehrung) continue;
				const srcCurrency = entry.waehrung.toUpperCase();
				const srcRate = rawRates[srcCurrency];
				if (srcRate == null) continue;
				const numericValue = parseFloat(entry.wert);
				if (isNaN(numericValue)) continue;

				for (const [tgtCurrency, tgtRate] of Object.entries(rawRates)) {
					const converted = numericValue * (tgtRate / srcRate);
					const decimals =
						currencyEntries.find((c) => c.code?.toUpperCase() === tgtCurrency)
							?.nachkommastellen ?? 2;
					tokenMap[`${entry.schluessel}_${tgtCurrency}`] = `${tgtCurrency} ${converted.toFixed(decimals)}`;
				}
			}

			// Geo-based currency: overwrite base token {{PreisA}} with visitor's local currency
			const country = request.headers.get('x-country')?.toUpperCase() ?? '';
			const geoCurrency = country === 'CH' || country === '' ? 'CHF' : EU_COUNTRIES.has(country) ? 'EUR' : 'USD';
			for (const entry of entries) {
				if (!entry.schluessel || !entry.waehrung) continue;
				const geoToken = tokenMap[`${entry.schluessel}_${geoCurrency}`];
				if (geoToken != null) tokenMap[entry.schluessel] = geoToken;
			}
		}

		return {
			settings,
			navigation,
			prismicTheme: theme,
			fonts,
			lang,
			mainLang,
			isMultilangActive,
			locales: allLocales,
			variables: tokenMap
		};
	} catch (e: any) {
		// Reiche SvelteKit-Errors (404 mit unseren Nachrichten) direkt weiter
		if (e.status) throw e;

		console.error('Layout Load Error:', e);
		throw error(500, { message: 'Technisches Problem beim Sprach-Setup im Layout.' });
	}
}
