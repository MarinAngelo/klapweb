import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getBooking } from '$lib/server/bookings';
import { cancelBooking, cancelTerms, isValidCancelToken } from '$lib/server/bookingCancel';
import { createClient } from '$lib/prismicio';
import { formatDateWithWeekday } from '$lib/utils/formatDate';

// Booking data + cancellation by button (link in the confirmation e-mail).
// Never cancel on GET: mail scanners open links automatically.
export const prerender = false;

async function findBooking(url: URL) {
	const id = url.searchParams.get('id') ?? '';
	if (!id) return { state: 'invalid' as const };
	const booking = await getBooking(id).catch(() => undefined);
	if (booking === undefined) return { state: 'error' as const };
	if (!booking) return { state: 'gone' as const };
	if (!isValidCancelToken(booking, url.searchParams.get('t'))) return { state: 'invalid' as const };
	return { state: 'ok' as const, booking };
}

/** Settings (contact, «Rechnungsstellung»); CMS unreachable → null */
async function loadSettings(fetchFn: typeof fetch) {
	try {
		const settings = await createClient({ fetch: fetchFn }).getSingle('settings');
		return settings.data as Record<string, unknown>;
	} catch {
		return null;
	}
}

export const load: PageServerLoad = async ({ url, fetch }) => {
	const found = await findBooking(url);
	if (found.state !== 'ok') return { state: found.state };
	const { booking } = found;

	const s = await loadSettings(fetch);
	// Contact for «nicht mehr online stornierbar»
	const contactEmail = ((s?.responsible_email as string) || (s?.e_mail as string) || '').trim();

	return {
		state: 'ok' as const,
		titel: booking.titel,
		datum: formatDateWithWeekday(booking.datum, booking.uhrzeit || null, 'de-CH', 'long'),
		terms: cancelTerms(booking),
		// «Rechnungsstellung» off → the fee is only stated, no invoice
		invoicing: s?.booking_invoice === true,
		contactEmail
	};
};

export const actions: Actions = {
	default: async ({ url, request, fetch }) => {
		const found = await findBooking(url);
		if (found.state !== 'ok')
			return fail(found.state === 'gone' ? 410 : 400, { error: found.state });
		// Terms at the time of the click (the deadline may have passed since the page was opened)
		const terms = cancelTerms(found.booking);
		if (terms.status === 'past' || terms.status === 'contact') {
			return fail(409, { error: terms.status });
		}
		const form = await request.formData();
		if (terms.status === 'fee' && form.get('acceptFee') !== 'on') {
			return fail(400, { error: 'fee_not_accepted' });
		}
		const s = await loadSettings(fetch);
		const { feeInvoiceNumber } = await cancelBooking(
			found.booking,
			terms,
			s?.booking_invoice === true
		);
		return { cancelled: true, withFee: !!feeInvoiceNumber };
	}
};
