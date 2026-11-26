import { error } from '@sveltejs/kit';
import {
	abzugNamen,
	berechneJahr,
	berechneMonat,
	isMonat,
	istSozialabzug,
	monatName,
	monateDesJahres,
	type Betraege,
	type MonatsResultat
} from '$lib/assistenz';
import { loadConfig, loadMonat, loadMonate } from '$lib/server/assistenz';
import { FEATURE_ASSISTENZ } from '$lib/server/features';

export const prerender = false;

/**
 * CSV export (Excel: semicolon, UTF-8 with BOM). Admin session via hooks.
 * ?jahr=2026 → one block per month (like the former spreadsheet) + year total per person
 * ?monat=2026-09 → one month
 */
export async function GET({ url }) {
	if (!FEATURE_ASSISTENZ) throw error(404, 'Nicht gefunden');
	const config = await loadConfig();
	const monatParam = url.searchParams.get('monat');
	const jahrParam = Number(url.searchParams.get('jahr'));

	let monate: MonatsResultat[];
	let jahresTotal: ReturnType<typeof berechneJahr> | null = null;
	let dateiname: string;
	if (monatParam !== null) {
		if (!isMonat(monatParam)) throw error(400, 'Ungültiger Monat');
		monate = [berechneMonat(config, monatParam, await loadMonat(monatParam))];
		dateiname = `assistenz-${monatParam}`;
	} else if (Number.isInteger(jahrParam) && jahrParam > 2000 && jahrParam < 2200) {
		const daten = await loadMonate(monateDesJahres(jahrParam, config.jahresbeginn));
		jahresTotal = berechneJahr(config, jahrParam, daten);
		monate = jahresTotal.monate;
		dateiname = `assistenz-${jahrParam}-${jahrParam + 1}`;
	} else {
		throw error(400, 'Parameter jahr oder monat fehlt');
	}

	const abzuege = abzugNamen(monate);
	// Column order: social insurance deductions, their subtotal, then the rest (withholding tax)
	const sozial = abzuege.filter(istSozialabzug);
	const uebrige = abzuege.filter((a) => !istSozialabzug(a));
	const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
	const line = (cells: (string | number)[]) => cells.map(esc).join(';');
	// Plain numbers (no thousands separator) so Excel can calculate with them
	const chf = (n: number) => n.toFixed(2);
	const h = (n: number) => String(n);

	const header = [
		'Person',
		'Anstellung',
		'Tagstunden',
		'Nachtstunden',
		'Stunden total',
		'Taglohn CHF',
		'Nachtlohn CHF',
		'Ferienentschädigung CHF',
		'Lohn brutto CHF',
		...sozial.map((a) => `${a} CHF`),
		...(sozial.length ? ['Sozialabzüge CHF'] : []),
		...uebrige.map((a) => `${a} CHF`),
		'Abzüge total CHF',
		'Lohn netto CHF'
	];
	const betraege = (b: Betraege, mitLohn = true) => [
		h(b.tag),
		h(b.nacht),
		h(b.stunden),
		...(mitLohn
			? [
					chf(b.taglohn),
					chf(b.nachtlohn),
					chf(b.ferien),
					chf(b.brutto),
					...sozial.map((a) => chf(b.abzuege[a] ?? 0)),
					...(sozial.length ? [chf(b.sozialabzuege)] : []),
					...uebrige.map((a) => chf(b.abzuege[a] ?? 0)),
					chf(b.abzuegeTotal),
					chf(b.netto)
				]
			: [])
	];

	const lines: string[] = [];
	if (jahresTotal) {
		lines.push(
			line([
				`Assistenz · ${monatName(monate[0].monat)} bis ${monatName(monate[monate.length - 1].monat)}`
			]),
			''
		);
	}
	for (const m of monate) {
		lines.push(line([monatName(m.monat)]));
		if (m.saetze) {
			const saetze = [
				`Tag CHF ${chf(m.saetze.tag)} / Std.`,
				`Nacht CHF ${chf(m.saetze.nacht)} / Std.`,
				...(m.saetze.ferien ? [`Ferienentschädigung ${m.saetze.ferien} %`] : []),
				...m.saetze.abzuege.map((a) => `${a.name} ${a.prozent} %`)
			].join(' · ');
			lines.push(line([saetze]));
		} else {
			lines.push(line(['Keine Stundensätze erfasst']));
		}
		lines.push(line(header));
		for (const z of m.zeilen) {
			lines.push(
				line([z.person.name, z.person.anstellung, ...(z.leer ? [] : betraege(z, !!m.saetze))])
			);
		}
		lines.push(line(['Monatstotal', '', ...betraege(m.total, !!m.saetze)]), '');
	}

	if (jahresTotal) {
		lines.push(line(['Jahrestotal pro Person']), line(header));
		for (const { person, total } of jahresTotal.proPerson) {
			lines.push(line([person.name, person.anstellung, ...betraege(total)]));
		}
		lines.push(line(['Jahrestotal', '', ...betraege(jahresTotal.total)]));
	}

	return new Response('﻿' + lines.join('\r\n'), {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${dateiname}.csv"`,
			'Cache-Control': 'no-store'
		}
	});
}
