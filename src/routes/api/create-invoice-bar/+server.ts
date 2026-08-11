import type { RequestHandler } from '@sveltejs/kit';
import { saveManualInvoice } from '$lib/server/invoices';
import { listCustomers, saveCustomer } from '$lib/server/customers';
import { saveEventRegistration } from '$lib/server/eventRegistrations';
import { env } from '$env/dynamic/private';

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
			land,
			isEventCheckout,
			eventUid,
			eventLabel,
			eventManagerEmail,
			labels
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

		// E-Mail für Event-Checkout
		if (isEventCheckout) {
			try {
				await saveEventRegistration({
					eventUid: eventUid ?? service ?? '',
					eventLabel: eventLabel ?? service ?? '',
					date: new Date().toISOString(),
					vorname: vorname ?? '',
					nachname: nachname ?? '',
					email: email ?? null,
					firma: firma ?? null,
					paymentMethod: 'bar',
					amount: amount ?? null,
					currency: currency || 'CHF',
					invoiceNumber
				});
			} catch (e) {
				console.error('Event-Registrierung konnte nicht gespeichert werden:', e);
			}

			const resendKey = env.RESEND_API_KEY;
			const fromEmail = env.INVOICE_FROM_EMAIL;
			if (resendKey && fromEmail) {
				try {
					const { Resend } = await import('resend');
					const resend = new Resend(resendKey);
					const fromName = env.INVOICE_FROM_NAME;
					const fromWithName = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
					const customerName = [vorname, nachname].filter(Boolean).join(' ') || 'Teilnehmer/in';
					const fmt = (n: number) =>
						new Intl.NumberFormat('de-CH', {
							style: 'currency',
							currency: currency || 'CHF',
							currencyDisplay: 'code',
							minimumFractionDigits: 2
						}).format(n);

					// Bestätigung an Teilnehmer/in
					if (email) {
						await resend.emails.send({
							from: fromWithName,
							to: email,
							subject: `Anmeldebestätigung – ${service}`,
							text: `Hallo ${customerName}\n\nVielen Dank für deine Anmeldung zu «${service}».\n\nBetrag: ${fmt(amount ?? 0)}\nZahlungsart: Barzahlung\n\nIch freue mich auf deine Teilnahme!`
						});
					}

					// Benachrichtigung an Eventverantwortliche/n
					const notifyEmail = eventManagerEmail || env.INVOICE_TO_EMAIL;
					if (notifyEmail) {
						const fieldLines = labels
							? Object.entries(labels as Record<string, string>)
									.filter(([k]) => body[k] !== undefined && body[k] !== '')
									.map(([k, l]) => `${l}: ${body[k]}`)
									.join('\n')
							: `Name: ${customerName}\nE-Mail: ${email ?? '—'}`;
						await resend.emails.send({
							from: fromWithName,
							to: notifyEmail,
							subject: `Neue Anmeldung (Bar): ${service} – ${invoiceNumber}`,
							text: `Neue Bar-Anmeldung eingegangen.\n\nVeranstaltung: ${service}\nRechnungsnummer: ${invoiceNumber}\nBetrag: ${fmt(amount ?? 0)}\n\n${fieldLines}`
						});
					}
				} catch (e) {
					console.error('Event-Bar-E-Mail fehlgeschlagen:', e);
				}
			}
		}

		return new Response(JSON.stringify({ ok: true, invoiceNumber }), { status: 200 });
	} catch (e) {
		console.error('create-invoice-bar fehlgeschlagen:', e);
		return new Response(JSON.stringify({ ok: false }), { status: 500 });
	}
};
