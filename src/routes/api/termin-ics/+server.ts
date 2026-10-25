import type { RequestHandler } from '@sveltejs/kit';
import { getRessourceBuchung } from '$lib/server/ressourceBuchungen';
import { createClient } from '$lib/prismicio';

function generateICS(
	titel: string,
	datum: string,
	uhrzeit: string,
	dauer: number | null,
	name?: string
): string | null {
	if (!datum || !uhrzeit) return null;

	const [y, m, d] = datum.split('-').map(Number);
	const [h, min] = uhrzeit.split(':').map(Number);
	const start = new Date(Date.UTC(y, m - 1, d, h, min));
	const end = new Date(start.getTime() + (dauer ?? 60) * 60000);

	const fmt = (dt: Date) =>
		dt
			.toISOString()
			.replace(/[-:]/g, '')
			.replace(/\.\d{3}/, '');

	const summary = name ? `${titel} – ${name}` : titel;

	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//klapweb//Terminbuchung//DE',
		'BEGIN:VEVENT',
		`UID:${Date.now()}@klapweb`,
		`DTSTAMP:${fmt(new Date())}`,
		`DTSTART:${fmt(start)}`,
		`DTEND:${fmt(end)}`,
		`SUMMARY:${summary}`,
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n');
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const id = url.searchParams.get('id');
	if (!id) return new Response('ID fehlt', { status: 400 });

	try {
		const client = createClient({ fetch });
		const dynamicClient = client as any;
		const [workdays, offers] = await Promise.all([
			dynamicClient.getAllByType('arbeitstag').catch(() => []),
			dynamicClient.getAllByType('angebot').catch(() => [])
		]);

		const today = new Date().toISOString().slice(0, 10);
		const { expandArbeitstag } = await import('$lib/server/terminSlots');
		const slot = workdays
			.flatMap((doc) => expandArbeitstag(doc, offers, today))
			.find((item) => item.id === id);

		if (!slot) return new Response('Termin nicht gefunden', { status: 404 });

		const ics = generateICS(slot.titel, slot.datum, slot.uhrzeit, slot.sessionLaenge);
		if (!ics) return new Response('ICS konnte nicht generiert werden', { status: 500 });

		return new Response(ics, {
			headers: {
				'Content-Type': 'text/calendar; charset=utf-8',
				'Content-Disposition': `attachment; filename="termin-${slot.datum}.ics"`
			}
		});
	} catch {
		return new Response('Fehler beim Generieren', { status: 500 });
	}
};
