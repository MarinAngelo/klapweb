import { redirect } from '@sveltejs/kit';
import { addUnsubscribe, isValidUnsubscribeToken } from '$lib/server/newsletter';

// One-Click-Abmeldung (RFC 8058): Mail-Programme senden POST an die URL aus dem
// Header "List-Unsubscribe" (Header "List-Unsubscribe-Post: List-Unsubscribe=One-Click").
export async function POST({ url }) {
	const email = url.searchParams.get('e') ?? '';
	const token = url.searchParams.get('t') ?? '';
	if (!isValidUnsubscribeToken(email, token)) return new Response('Invalid link', { status: 400 });
	await addUnsubscribe(email);
	return new Response('Unsubscribed', { status: 200 });
}

// Browser-Aufruf derselben URL → Bestätigungsseite
export function GET({ url }) {
	throw redirect(303, `/newsletter/abmelden?${url.searchParams}`);
}
