import type { RequestHandler } from '@sveltejs/kit';
import { saveCustomer, listCustomers } from '$lib/server/customers';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const email = body.email?.trim().toLowerCase();

		// Prüfe ob Kunde mit E-Mail bereits existiert (E-Mail ist primäres Merkmal)
		if (email) {
			const existingCustomers = await listCustomers();
			const existingCustomer = existingCustomers.find(
				(c) => c.email && c.email.toLowerCase() === email
			);

			if (existingCustomer) {
				return new Response(
					JSON.stringify({ ok: false, exists: true, message: 'Kunde existiert bereits' }),
					{ status: 409 }
				);
			}
		}

		// Falls keine E-Mail, prüfe nach Name
		if (!email) {
			const vorname = body.vorname?.trim().toLowerCase();
			const nachname = body.nachname?.trim().toLowerCase();

			if (vorname && nachname) {
				const existingCustomers = await listCustomers();
				const existingCustomer = existingCustomers.find(
					(c) => c.vorname?.toLowerCase() === vorname && c.nachname?.toLowerCase() === nachname
				);

				if (existingCustomer) {
					return new Response(
						JSON.stringify({
							ok: false,
							exists: true,
							message: 'Kunde mit diesem Namen existiert bereits'
						}),
						{ status: 409 }
					);
				}
			}
		}

		await saveCustomer(body);
		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	} catch (e) {
		console.error('save-customer fehlgeschlagen:', e);
		return new Response(JSON.stringify({ ok: false }), { status: 500 });
	}
};
