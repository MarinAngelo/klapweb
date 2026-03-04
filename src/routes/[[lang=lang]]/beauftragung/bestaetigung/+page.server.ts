export const prerender = false;

export async function load({ parent }) {
	const { settings } = await parent();
	const d = settings.data as Record<string, unknown>;
	return {
		confirmationTexts: {
			stripe: d.payment_stripe_confirmation_text ?? null,
			rechnung: d.payment_rechnung_confirmation_text ?? null,
			bar: d.payment_bar_confirmation_text ?? null
		}
	};
}
