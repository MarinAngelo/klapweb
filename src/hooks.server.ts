import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/sessions';
import { getUserByEmail } from '$lib/server/users';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('klap_user_session');
	if (sessionToken) {
		try {
			const session = await getSession(sessionToken);
			if (session) {
				const user = await getUserByEmail(session.email);
				if (user) {
					event.locals.user = {
						id: user.id,
						email: user.email,
						name: user.name,
						verified: user.verified
					};
				}
			}
		} catch {
			// Blobs nicht verfügbar (z.B. lokal ohne ENV) — ignorieren
		}
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const css = event.locals.themeColorsCss;
			if (!css) return html;
			// Inline-Style auf <html>: schlägt immer alle Stylesheets,
			// egal in welcher Reihenfolge Vite/Browser sie lädt.
			return html.replace('<html ', `<html style="${css}" `);
		}
	});
};
