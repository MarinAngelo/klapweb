import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listBookingsByEmail } from '$lib/server/bookings';
import { FEATURE_TERMINBUCHUNG } from '$lib/server/features';
import { createClient } from '$lib/prismicio';
import { asText } from '@prismicio/client';

export const prerender = false;

export const load: PageServerLoad = async ({ locals, fetch }) => {
	if (!FEATURE_TERMINBUCHUNG) throw error(404, 'Funktion nicht verfügbar');
	if (!locals.user) throw redirect(303, '/konto/anmelden');

	let bookings: Awaited<ReturnType<typeof listBookingsByEmail>> = [];
	try {
		bookings = await listBookingsByEmail(locals.user.email);
	} catch {
		// Blobs nicht verfügbar
	}

	// Ort (Name + Adresse) pro Buchung auflösen
	const angebotIds = [...new Set(bookings.map((b) => b.angebotId).filter(Boolean))] as string[];
	if (angebotIds.length > 0) {
		try {
			const client = createClient({ fetch });
			const dynamicClient = client as any;
			const [offers, orte] = await Promise.all([
				dynamicClient.getAllByType('angebot').catch(() => []),
				dynamicClient.getAllByType('ort').catch(() => [])
			]);
			const ortByUid = new Map<string, any>(orte.map((o: any) => [o.uid, o]));
			const ortByAngebot = new Map(
				offers.map((o: any) => {
					const ortLink = (o.data as any)?.ort;
					const ortDoc = ortLink?.uid ? ortByUid.get(ortLink.uid) : null;
					const d = ortDoc?.data as any;
					const adresse = d?.adresse
						? Array.isArray(d.adresse)
							? asText(d.adresse)
							: String(d.adresse)
						: '';
					return [o.uid, ortDoc ? { name: d?.name ?? '', adresse } : null];
				})
			);
			bookings = bookings.map((b) => ({
				...b,
				ort: b.angebotId ? (ortByAngebot.get(b.angebotId) ?? null) : null
			}));
		} catch {
			// Prismic nicht erreichbar — Buchungen ohne Ort anzeigen
		}
	}

	return {
		user: locals.user,
		bookings
	};
};
