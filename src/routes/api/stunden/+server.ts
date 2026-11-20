import { json } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';
import { FEATURE_STUNDENABRECHNUNG } from '$lib/server/features';
import { hasPageAccess } from '$lib/server/pageAuth';
import { isAdmin } from '$lib/server/adminAuth';
import { addStunden, parseStundenInput } from '$lib/server/stunden';

/**
 * Time sheet entry from the Formular variation «Stundenabrechnung».
 * Only with access to the password-protected pages (cookie after the page login) or as admin —
 * the form must be on a password-protected page («Inhalte prüfen» checks that).
 *
 * Body: { name, von, bis, taetigkeit?, spesen?, spesenText? } → { ok, id } | { error: i18n key }
 */

export const prerender = false;

export async function POST({ request, cookies, fetch }) {
	if (!FEATURE_STUNDENABRECHNUNG) return json({ error: 'unavailable' }, { status: 404 });

	if (!isAdmin(cookies)) {
		const settings = await createClient({ fetch })
			.getSingle('settings')
			.catch(() => null);
		const pagePassword = (settings?.data as any)?.page_password as string | null;
		if (!hasPageAccess(cookies, pagePassword)) {
			return json(
				{ error: 'Bitte melde dich zuerst mit dem Seiten-Passwort an.' },
				{ status: 403 }
			);
		}
	}

	const body = await request.json().catch(() => null);
	const input = parseStundenInput(body ?? {});
	if ('error' in input) return json({ error: input.error }, { status: 400 });

	let id = '';
	try {
		id = (await addStunden(input)).id;
	} catch (e) {
		console.error('[stunden] Eintrag konnte nicht gespeichert werden:', e);
		return json({ error: 'Der Eintrag konnte nicht gespeichert werden.' }, { status: 500 });
	}
	return json({ ok: true, id });
}
