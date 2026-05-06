import { json } from '@sveltejs/kit';
import { checkInBuchung } from '$lib/server/ressourceBuchungen';

export async function POST({ request }) {
	const { referenz, items } = await request.json();
	if (!referenz?.trim()) return json({ error: 'Buchungsreferenz fehlt.' }, { status: 400 });

	try {
		await checkInBuchung(referenz.trim(), items ?? []);
		return json({ success: true });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'NOT_FOUND') return json({ error: 'NOT_FOUND' }, { status: 404 });
		if (msg === 'ALREADY_DONE') return json({ error: 'ALREADY_DONE' }, { status: 409 });
		return json({ error: 'SERVER_ERROR' }, { status: 500 });
	}
}
