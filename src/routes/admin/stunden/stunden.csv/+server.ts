import { error } from '@sveltejs/kit';
import { FEATURE_STUNDENABRECHNUNG } from '$lib/server/features';
import { dauerMinuten, listStunden } from '$lib/server/stunden';

export const prerender = false;

/** CSV export of the time sheet (Excel: semicolon, UTF-8 with BOM). Admin session via hooks. */
export async function GET() {
	if (!FEATURE_STUNDENABRECHNUNG) throw error(404, 'Nicht gefunden');
	const entries = await listStunden();
	const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
	const dt = (v: string) => v.replace('T', ' ');
	const hours = (min: number) => (min / 60).toFixed(2);

	let totalMin = 0;
	let totalSpesen = 0;
	const rows = entries.map((e) => {
		const min = dauerMinuten(e.von, e.bis);
		totalMin += min;
		totalSpesen += e.spesen;
		return [
			e.name ?? '',
			dt(e.von),
			dt(e.bis),
			e.taetigkeit,
			hours(min),
			e.spesenText ?? '',
			e.spesen.toFixed(2)
		]
			.map(esc)
			.join(';');
	});
	const header = [
		'Name',
		'Von',
		'Bis',
		'Tätigkeit',
		'Stunden',
		'Spesen-Beschreibung',
		'Spesen (CHF)'
	];
	const total = ['Total', '', '', '', hours(totalMin), '', totalSpesen.toFixed(2)];
	const csv = [header.map(esc).join(';'), ...rows, total.map(esc).join(';')].join('\r\n');

	return new Response('﻿' + csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="stunden-${new Date().toISOString().slice(0, 10)}.csv"`,
			'Cache-Control': 'no-store'
		}
	});
}
