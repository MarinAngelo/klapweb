import { json } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';
import { FEATURE_NEWSLETTER } from '$lib/server/features';
import { isValidEmail, loadBranding, sendSubscribeConfirmation } from '$lib/server/newsletter';

// Newsletter-Anmeldung (Formular-Variante "Newsletter abonnieren"):
// sendet nur die Bestätigungsmail (Double-Opt-in) — gespeichert wird erst nach dem Klick darin.
export async function POST({ request, fetch, url }) {
	if (!FEATURE_NEWSLETTER) return json({ error: 'not_available' }, { status: 404 });

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid' }, { status: 400 });
	}

	// Honeypot: real visitors never fill this hidden field → pretend success for bots
	if (body.website) return json({ ok: true });

	const email = String(body.email ?? '').trim();
	if (!isValidEmail(email)) return json({ error: 'email' }, { status: 400 });
	if (body.consent !== true) return json({ error: 'consent' }, { status: 400 });

	const lang = String(body.lang ?? 'de-ch');
	const vorname =
		String(body.vorname ?? '')
			.trim()
			.slice(0, 100) || undefined;
	const nachname =
		String(body.nachname ?? '')
			.trim()
			.slice(0, 100) || undefined;

	try {
		const client = createClient({ fetch }) as any;
		const branding = await loadBranding(client, lang);
		await sendSubscribeConfirmation({ email, vorname, nachname, lang }, branding, url.origin);
	} catch (e) {
		console.error('Newsletter-Anmeldung fehlgeschlagen:', e);
		return json({ error: 'send' }, { status: 500 });
	}

	// Same answer whether or not the address is already subscribed (no address enumeration)
	return json({ ok: true });
}
