import type { RequestHandler } from '@sveltejs/kit';
import { saveCustomer } from '$lib/server/customers';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		await saveCustomer(body);
		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	} catch (e) {
		console.error('save-customer fehlgeschlagen:', e);
		return new Response(JSON.stringify({ ok: false }), { status: 500 });
	}
};
