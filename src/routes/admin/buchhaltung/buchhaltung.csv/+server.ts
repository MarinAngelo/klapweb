import { error } from '@sveltejs/kit';
import { FEATURE_BUCHHALTUNG } from '$lib/server/features';
import { listBuchungen } from '$lib/server/buchhaltung';

export const prerender = false;

/** CSV export of one year (?jahr=YYYY, Excel: semicolon, UTF-8 with BOM). Admin session via hooks. */
export async function GET({ url }) {
	if (!FEATURE_BUCHHALTUNG) throw error(404, 'Nicht gefunden');
	const year = url.searchParams.get('jahr') ?? String(new Date().getFullYear());
	const entries = (await listBuchungen())
		.filter((b) => b.datum.startsWith(year))
		.sort((a, b) => a.datum.localeCompare(b.datum));
	const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
	const amount = (n: number) => n.toFixed(2);
	const lines = [
		['Datum', 'Typ', 'Kategorie', 'Text', 'Einnahme', 'Ausgabe', 'Beleg'].map(esc).join(';'),
		...entries.map((b) =>
			[
				b.datum.split('-').reverse().join('.'),
				b.typ === 'einnahme' ? 'Einnahme' : 'Ausgabe',
				b.kategorie,
				b.text,
				b.typ === 'einnahme' ? amount(b.betrag) : '',
				b.typ === 'ausgabe' ? amount(b.betrag) : '',
				b.beleg?.name ?? ''
			]
				.map(esc)
				.join(';')
		)
	];
	const income = entries.filter((b) => b.typ === 'einnahme').reduce((s, b) => s + b.betrag, 0);
	const expense = entries.filter((b) => b.typ === 'ausgabe').reduce((s, b) => s + b.betrag, 0);
	lines.push(['', '', '', 'Total', amount(income), amount(expense), ''].map(esc).join(';'));
	lines.push(['', '', '', 'Ergebnis', amount(income - expense), '', ''].map(esc).join(';'));
	return new Response('﻿' + lines.join('\r\n'), {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="buchhaltung-${year}.csv"`
		}
	});
}
