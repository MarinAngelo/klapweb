/**
 * Location («Ort») of an appointment offer for the booking e-mails —
 * shared by the confirmation (api/buche-termin) and the reminder (bookingReminders).
 */
import {
	osmMarkerUrl,
	osmSearchUrl,
	parseMapPoint,
	resolveGoogleShortLink
} from '$lib/mapPoint.js';

export type OfferLocation = {
	ortName: string;
	ortAdresse: string;
	ortWegbeschreibung: string;
	ortTelefon: string;
	ortKarte: string;
};

export const NO_LOCATION: OfferLocation = {
	ortName: '',
	ortAdresse: '',
	ortWegbeschreibung: '',
	ortTelefon: '',
	ortKarte: ''
};

/** Location linked in the offer; inactive («Aktiv» off) or unreachable → empty */
export async function loadOfferLocation(
	client: any,
	offerDoc: any,
	fetchFn: typeof fetch = fetch
): Promise<OfferLocation> {
	const ortLink = offerDoc?.data?.ort;
	if (!ortLink?.uid) return NO_LOCATION;
	try {
		const ortDoc = await client.getByUID('ort', ortLink.uid);
		const o = ortDoc.data as any;
		if (o.aktiv === false) return NO_LOCATION;
		const lines = (blocks: unknown) =>
			Array.isArray(blocks) ? blocks.map((b: any) => b?.text ?? '').filter(Boolean) : [];
		const ortName = o.name ?? '';
		const ortAdresse = lines(o.adresse).join(', ');
		// Map link: exact «Kartenpunkt» of the location, otherwise search for the address
		const punkt =
			parseMapPoint(o.geo_koordinaten) ??
			(await resolveGoogleShortLink(o.geo_koordinaten ?? '', fetchFn)).point;
		const suche = [ortName, ortAdresse].filter(Boolean).join(', ');
		return {
			ortName,
			ortAdresse,
			ortWegbeschreibung: lines(o.wegbeschreibung).join('\n'),
			ortTelefon: (o.telefon ?? '').trim(),
			ortKarte: punkt ? osmMarkerUrl(punkt) : suche ? osmSearchUrl(suche) : ''
		};
	} catch {
		return NO_LOCATION;
	}
}
