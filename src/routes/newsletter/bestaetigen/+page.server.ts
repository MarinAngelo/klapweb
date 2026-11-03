import { fail } from '@sveltejs/kit';
import { addSubscriber, readSubscribeConfirm } from '$lib/server/newsletter';

// Bestätigung der Newsletter-Anmeldung (Link aus der Bestätigungsmail, Double-Opt-in).
// Gespeichert wird erst per Button (POST): Mail-Scanner, die Links vorab aufrufen, bestätigen so nichts.
export const prerender = false;

export function load({ url }) {
	const data = readSubscribeConfirm(
		url.searchParams.get('d') ?? '',
		url.searchParams.get('s') ?? ''
	);
	return { valid: Boolean(data), email: data?.email ?? '', no_index: true };
}

export const actions = {
	default: async ({ url }) => {
		const data = readSubscribeConfirm(
			url.searchParams.get('d') ?? '',
			url.searchParams.get('s') ?? ''
		);
		if (!data) return fail(400, { error: 'Dieser Bestätigungslink ist ungültig oder abgelaufen.' });
		try {
			await addSubscriber(data);
		} catch (e) {
			console.error('Newsletter-Bestätigung fehlgeschlagen:', e);
			return fail(500, {
				error: 'Die Bestätigung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.'
			});
		}
		return { done: true };
	}
};
