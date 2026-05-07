import { json } from '@sveltejs/kit';
import { getBuchungByReferenz } from '$lib/server/ressourceBuchungen';

export async function POST({ request }) {
	const { referenz, typ } = await request.json();
	if (!referenz?.trim()) return json({ error: 'Buchungsreferenz fehlt.' }, { status: 400 });

	const buchung = await getBuchungByReferenz(referenz.trim());
	if (!buchung) return json({ error: 'NOT_FOUND' }, { status: 404 });

	const today = new Date().toISOString().slice(0, 10);
	if (today < buchung.von) return json({ error: 'TOO_EARLY', von: buchung.von }, { status: 400 });

	if (typ === 'einChecken' && (buchung.status === 'checked_in' || buchung.status === 'checked_out')) {
		return json({ error: 'ALREADY_DONE' }, { status: 409 });
	}
	if (typ === 'ausChecken' && buchung.status === 'checked_out') {
		return json({ error: 'ALREADY_DONE' }, { status: 409 });
	}

	return json({ ok: true });
}
