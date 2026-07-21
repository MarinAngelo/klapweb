import type { RequestHandler } from '@sveltejs/kit';
import { saveManualInvoice } from '$lib/server/invoices';
import { listCustomers, saveCustomer } from '$lib/server/customers';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const {
			date,
			paymentMethod,
			service,
			amount,
			currency,
			discountCode,
			vorname,
			nachname,
			firma,
			email,
			adresse,
			plz,
			ort,
			land
		} = body;

		// Kundendaten speichern (mit Duplikat-Prüfung)
		try {
			const emailLower = email?.trim().toLowerCase();
			const existingCustomers = await listCustomers();

			// Prüfe E-Mail (primär)
			let isDuplicate = false;
			if (emailLower) {
				const existingCustomer = existingCustomers.find(
					(c) => c.email && c.email.toLowerCase() === emailLower
				);
				if (!existingCustomer) {
					await saveCustomer({
						date,
						paymentMethod,
						service,
						amount,
						currency,
						vorname,
						nachname,
						firma,
						email,
						adresse,
						plz,
						ort,
						land
					});
				}
			}
		} catch (e) {
			console.error('Kunde konnte nicht gespeichert werden:', e);
		}

		// Erstelle Rechnung
		const invoiceNumber = `INV-${Date.now()}`;
		const invoiceId = await saveManualInvoice({
			invoiceNumber,
			date: new Date().toISOString(),
			status: 'gespeichert',
			paymentStatus: 'offen',
			paymentMethod: 'bar',
			vorname,
			nachname,
			firma: firma || undefined,
			email: email || undefined,
			adresse: adresse || undefined,
			plz: plz || undefined,
			ort: ort || undefined,
			land: land || undefined,
			items: [
				{
					description: service,
					quantity: 1,
					unitPrice: amount ?? 0
				}
			],
			notes: discountCode ? `Rabatt-Code: ${discountCode}` : '',
			emailSentAt: null,
			currency
		});

		return new Response(JSON.stringify({ ok: true, invoiceNumber }), { status: 200 });
	} catch (e) {
		console.error('create-invoice-bar fehlgeschlagen:', e);
		return new Response(JSON.stringify({ ok: false }), { status: 500 });
	}
};
