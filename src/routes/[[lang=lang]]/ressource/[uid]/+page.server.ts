import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';
import { getBelegtePerioden } from '$lib/server/ressourceBuchungen';

export async function load({ params, parent, fetch }: { params: { uid: string; lang?: string }; parent: () => Promise<{ lang: string }>; fetch: typeof globalThis.fetch }) {
	const { lang } = await parent();
	const client = createClient({ fetch });

	// Load the ressource page document
	let doc: any;
	try {
		doc = await client.getByUID('ressource', params.uid, { lang });
	} catch {
		throw error(404, { message: 'Ressource nicht gefunden' });
	}

	// Find RessourceBuchung slice and read the linked ressource UID.
	// Falls back to the page's own UID if no link is set.
	const buchungSlice = (doc.data.slices ?? []).find(
		(s: any) => s.slice_type === 'ressource_buchung'
	);
	const linkedUid: string = buchungSlice?.primary?.ressource_link?.uid ?? params.uid;

	// If the linked UID differs from the page UID, fetch the linked ressource document
	let ressourceDoc = doc;
	if (linkedUid !== params.uid) {
		try {
			ressourceDoc = await client.getByUID('ressource', linkedUid, { lang });
		} catch {
			// fall back to page doc
		}
	}

	const d = ressourceDoc.data as any;

	const schlafzimmer = (d.schlafzimmer ?? []).map((z: any) => ({
		zimmer_name: z.zimmer_name ?? '',
		bett_typ: z.bett_typ ?? '',
		anzahl_betten: z.anzahl_betten ?? 1,
		bild: z.bild?.url ? { url: z.bild.url, alt: z.bild.alt ?? '' } : null
	}));

	const saisonpreise = (d.saisonpreise ?? [])
		.filter((s: any) => s.von && s.bis)
		.map((s: any) => ({
			von: s.von as string,
			bis: s.bis as string,
			preis_pro_nacht: (s.preis_pro_nacht as number) ?? (d.preis_pro_nacht as number) ?? 0
		}));

	let bookedRanges: Array<{ von: string; bis: string; zimmer: string[] }> = [];
	try {
		bookedRanges = await getBelegtePerioden(linkedUid);
	} catch {
		// non-critical, client will fall back to empty
	}

	return {
		doc,
		title: (d.name as string) || '',
		bookedRanges,
		ressource: {
			uid: ressourceDoc.uid as string,
			name: (d.name as string) ?? '',
			maxPersonen: (d.max_personen as number) ?? 0,
			minNaechte: (d.min_naechte as number) ?? 1,
			preisProNacht: (d.preis_pro_nacht as number) ?? 0,
			saisonpreise,
			schlafzimmer
		}
	};
}

export async function entries() {
	const client = createClient();
	const docs = await client.getAllByType('ressource', { lang: '*' });
	return docs.map((d) => ({ lang: d.lang, uid: d.uid }));
}
