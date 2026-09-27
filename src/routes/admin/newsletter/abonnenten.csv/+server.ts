import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { FEATURE_NEWSLETTER } from '$lib/server/features';
import { listSubscribersWithStatus } from '$lib/server/newsletter';
import { t } from '$lib/i18n/translations';

// CSV-Export der Newsletter-Abonnenten (u.a. Nachweis der Einwilligungen)
export const prerender = false;

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

export async function GET({ url }) {
	if (!FEATURE_NEWSLETTER) throw error(404, 'Nicht gefunden');
	const secret = env.ADMIN_SECRET;
	if (!secret || url.searchParams.get('secret') !== secret) throw error(403, 'Kein Zugriff');

	const subscribers = await listSubscribersWithStatus();
	const lang = url.searchParams.get('lang') || 'de-ch';
	const header = ['E-Mail', 'Vorname', 'Nachname', 'Sprache', 'Bestätigt am', 'Status'].map((k) =>
		t(k, lang)
	);
	const rows = subscribers.map((s) => [
		s.email,
		s.vorname ?? '',
		s.nachname ?? '',
		s.lang ?? '',
		s.confirmedAt,
		t(s.unsubscribed ? 'abgemeldet' : 'aktiv', lang)
	]);
	// BOM + semicolon → opens correctly in Excel (CH/DE locale)
	const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n');
	const date = new Date().toISOString().slice(0, 10);
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="newsletter-abonnenten-${date}.csv"`,
			'Cache-Control': 'no-store'
		}
	});
}
