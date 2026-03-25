import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';

export const POST: RequestHandler = async ({ request, fetch }) => {
	let code: string;
	try {
		({ code } = await request.json());
	} catch {
		return new Response(JSON.stringify({ error: 'Ungültige Anfrage' }), { status: 400 });
	}

	if (!code?.trim()) {
		return new Response(JSON.stringify({ error: 'Kein Code angegeben' }), { status: 400 });
	}

	try {
		const client = createClient({ fetch });
		const settings = await client.getSingle('settings');
		const codes: Array<{ code?: string; discount_percent?: number }> =
			(settings.data as any).discount_codes ?? [];

		const match = codes.find((c) => c.code?.trim() === code.trim());
		if (!match || match.discount_percent == null) {
			return new Response(JSON.stringify({ error: 'Ungültiger Code' }), { status: 404 });
		}

		return new Response(JSON.stringify({ discount: match.discount_percent }), { status: 200 });
	} catch {
		return new Response(JSON.stringify({ error: 'Fehler beim Prüfen des Codes' }), { status: 500 });
	}
};
