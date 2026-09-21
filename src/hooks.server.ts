import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/sessions';
import { getUserByEmail } from '$lib/server/users';

// In-Memory-Cache für Session→User-Auflösung.
// Ohne Cache kostet jeder Request mit Session-Cookie zwei serielle
// Netlify-Blobs-Calls (getSession + getUserByEmail) = 2–5 s pro Navigation in Dev.
// Kurzer TTL: Logout löscht das Cookie clientseitig, E-Mail-Verifizierung
// spätestens nach TTL sichtbar.
type CachedUser = { id: string; email: string; name: string; verified: boolean } | null;
const _userCache = new Map<string, { user: CachedUser; at: number }>();
const USER_CACHE_TTL_MS = 60 * 1000; // 60 Sekunden
const USER_CACHE_MAX = 500;

function getCachedUser(token: string): CachedUser | undefined {
	const entry = _userCache.get(token);
	if (!entry) return undefined;
	if (Date.now() - entry.at > USER_CACHE_TTL_MS) {
		_userCache.delete(token);
		return undefined;
	}
	return entry.user;
}

function setCachedUser(token: string, user: CachedUser): void {
	if (_userCache.size >= USER_CACHE_MAX) {
		// Ältesten Eintrag entfernen (Map iteriert in Insertion-Order)
		const oldest = _userCache.keys().next().value;
		if (oldest) _userCache.delete(oldest);
	}
	_userCache.set(token, { user, at: Date.now() });
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('klap_user_session');
	if (sessionToken) {
		const cached = getCachedUser(sessionToken);
		if (cached !== undefined) {
			if (cached) event.locals.user = cached;
		} else {
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
						setCachedUser(sessionToken, event.locals.user);
					} else {
						setCachedUser(sessionToken, null);
					}
				} else {
					setCachedUser(sessionToken, null);
				}
			} catch {
				// Blobs nicht verfügbar (z.B. lokal ohne ENV) — ignorieren
			}
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
