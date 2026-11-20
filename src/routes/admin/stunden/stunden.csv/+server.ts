import { error } from '@sveltejs/kit';
import { FEATURE_STUNDENABRECHNUNG } from '$lib/server/features';
import { dauerMinuten, listStunden } from '$lib/server/stunden';

export const prerender = false;

/** CSV export of the time sheet (Excel: semicolon, UTF-8 with BOM). Admin session via hooks. */
export async function GET({ url }) {
	if (!FEATURE_STUNDENABRECHNUNG) throw error(404, 'Nicht gefunden');
	// Filters: ?name=… (one person), ?status=offen|abgerechnet, ?abrechnung=<id> (one billing)
	const nameFilter = url.searchParams.get('name');
	const statusFilter = url.searchParams.get('status');
	const billingFilter = url.searchParams.get('abrechnung');
	const entries = (await listStunden()).filter(
		(e) =>
			(nameFilter === null ||
				(e.name ?? '').trim().toLowerCase() === nameFilter.trim().toLowerCase()) &&
			(statusFilter !== 'offen' || !e.abrechnung) &&
			(statusFilter !== 'abgerechnet' || !!e.abrechnung) &&
			(billingFilter === null || e.abrechnung === billingFilter)
	);
	// Billing time in Swiss time
	const billedAt = (iso?: string) =>
		iso
			? new Date(iso).toLocaleString('de-CH', {
					timeZone: 'Europe/Zurich',
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
			: '';
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
			e.spesen.toFixed(2),
			e.abrechnung ? `abgerechnet ${billedAt(e.abgerechnetAm)}` : 'offen'
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
		'Spesen (CHF)',
		'Status'
	];
	const total = ['Total', '', '', '', hours(totalMin), '', totalSpesen.toFixed(2), ''];
	const csv = [header.map(esc).join(';'), ...rows, total.map(esc).join(';')].join('\r\n');

	const slug = [nameFilter ?? '', statusFilter ?? '', billingFilter ? 'abrechnung' : '']
		.filter(Boolean)
		.join(' ')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return new Response('﻿' + csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="stunden${slug ? `-${slug}` : ''}-${new Date().toISOString().slice(0, 10)}.csv"`,
			'Cache-Control': 'no-store'
		}
	});
}
