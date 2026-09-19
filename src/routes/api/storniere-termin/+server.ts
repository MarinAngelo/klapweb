import type { RequestHandler } from '@sveltejs/kit';
import { deleteBooking, isBooked } from '$lib/server/bookings';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	if (!id) {
		return html(400, 'Buchungs-ID fehlt.');
	}

	const booked = await isBooked(id).catch(() => null);
	if (booked === null) {
		return html(
			500,
			'Die Buchung konnte nicht geprüft werden. Bitte versuchen Sie es später erneut.'
		);
	}
	if (!booked) {
		return html(200, 'Diese Buchung wurde bereits storniert oder existiert nicht mehr.');
	}

	await deleteBooking(id);

	return html(200, 'Ihre Buchung wurde erfolgreich storniert. Der Termin ist wieder verfügbar.');
};

function html(status: number, message: string) {
	return new Response(
		`<!doctype html><html><head><meta charset="utf-8"><title>Stornierung</title>
		<style>body{font-family:sans-serif;padding:2rem;max-width:480px;margin:0 auto;line-height:1.6;color:#222}</style>
		</head><body><p>${message}</p></body></html>`,
		{ status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
}
