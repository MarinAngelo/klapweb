import { fail } from '@sveltejs/kit';
import { addUnsubscribe, isValidUnsubscribeToken } from '$lib/server/newsletter';

// Abmeldung von Info-Mails (Link in jeder Mail). Bewusst ohne Feature-Gate:
// die Abmeldung muss auch funktionieren, wenn das Feature später deaktiviert wird.
export const prerender = false;

export function load({ url }) {
	const email = url.searchParams.get('e') ?? '';
	const token = url.searchParams.get('t') ?? '';
	return { email, valid: isValidUnsubscribeToken(email, token), no_index: true };
}

export const actions = {
	default: async ({ url }) => {
		const email = url.searchParams.get('e') ?? '';
		const token = url.searchParams.get('t') ?? '';
		if (!isValidUnsubscribeToken(email, token))
			return fail(400, { error: 'Ungültiger Abmelde-Link' });
		try {
			await addUnsubscribe(email);
		} catch (e) {
			console.error('Newsletter-Abmeldung fehlgeschlagen:', e);
			return fail(500, {
				error: 'Die Abmeldung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.'
			});
		}
		return { done: true };
	}
};
