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

export const load: PageServerLoad = async ({ url, fetch }) => {
	const found = await findBooking(url);
	if (found.state !== 'ok') return { state: found.state };
	const { booking } = found;

	// Contact for «nicht mehr online stornierbar»
	let contactEmail = '';
	try {
		const settings = await createClient({ fetch }).getSingle('settings');
		const s = settings.data as Record<string, unknown>;
		contactEmail = ((s.responsible_email as string) || (s.e_mail as string) || '').trim();
	} catch {
		// CMS unreachable → no contact line
	}

	return {
		state: 'ok' as const,
		titel: booking.titel,
		datum: formatDateWithWeekday(booking.datum, booking.uhrzeit || null, 'de-CH', 'long'),
		terms: cancelTerms(booking),
		contactEmail
	};
};

export const actions: Actions = {
	default: async ({ url, request }) => {
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
		const { feeInvoiceNumber } = await cancelBooking(found.booking, terms);
		return { cancelled: true, withFee: !!feeInvoiceNumber };
	}
};
