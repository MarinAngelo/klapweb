import { createClient } from '$lib/prismicio';

export const prerender = false;

export async function load({ parent, url, fetch, cookies }) {
	const { settings, lang } = await parent();
	const d = settings.data as Record<string, unknown>;

	let confirmationTexts = {
		stripe: d.payment_stripe_confirmation_text ?? null,
		rechnung: d.payment_rechnung_confirmation_text ?? null,
		bar: d.payment_bar_confirmation_text ?? null
	};
	let confirmationHeading: string | null = null;
	let confirmationIntro: string | null = null;

	const isEventCheckout = url.searchParams.get('event_checkout') === 'true';
	const serviceUid = url.searchParams.get('service') ?? '';

	if (isEventCheckout && serviceUid) {
		const client = createClient({ fetch, cookies });
		const eventDoc = await client.getByUID('event', serviceUid, { lang }).catch(() => null);
		if (eventDoc) {
			const ed = eventDoc.data as Record<string, unknown>;
			confirmationHeading = (ed.confirmation_heading as string)?.trim() || null;
			confirmationIntro = (ed.confirmation_intro as string)?.trim() || null;
			confirmationTexts = {
				stripe: null,
				rechnung: ed.confirmation_text_rechnung ?? confirmationTexts.rechnung,
				bar: ed.confirmation_text_bar ?? confirmationTexts.bar
			};
		}
	}

	return { confirmationTexts, confirmationHeading, confirmationIntro };
}
