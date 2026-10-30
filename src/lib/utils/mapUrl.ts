/**
 * «Kartenpunkt» fields → embeddable OpenStreetMap + directions link.
 * Parsing lives in $lib/mapPoint.js (coordinates, OSM, Google, Apple, swisstopo).
 * Every input is shown as OpenStreetMap — Google links are only read for their coordinates
 * (short links are resolved server-side via /api/maps-embed), visitors never load Google.
 */
import {
	isGoogleShortLink,
	osmDirectionsUrl,
	osmEmbedUrl,
	parseMapPoint,
	type MapPoint
} from '$lib/mapPoint.js';

/** Map provider for the consent banner — always OpenStreetMap now */
export type MapProvider = 'openstreetmap';

export function getMapProvider(_url?: string | null): MapProvider {
	return 'openstreetmap';
}

/**
 * «Kartenpunkt» value → point. Google short links are resolved by our server (/api/maps-embed).
 * Not understood (e.g. Google place link without coordinates) → null.
 */
export async function resolveMapPoint(raw: string | null | undefined): Promise<MapPoint | null> {
	const point = parseMapPoint(raw);
	if (point || !raw || !isGoogleShortLink(raw)) return point;
	try {
		const res = await fetch(`/api/maps-embed?url=${encodeURIComponent(raw.trim())}`);
		if (res.ok) return ((await res.json()).point as MapPoint) ?? null;
	} catch {
		// network error → no map
	}
	return null;
}

/** Resolves a «Kartenpunkt» value to an OpenStreetMap embed + directions link (empty = no map) */
export async function resolveMapUrl(
	raw: string
): Promise<{ provider: MapProvider; embedUrl: string; directionsUrl: string }> {
	const point = await resolveMapPoint(raw);
	return point
		? {
				provider: 'openstreetmap',
				embedUrl: osmEmbedUrl(point),
				directionsUrl: osmDirectionsUrl(point)
			}
		: { provider: 'openstreetmap', embedUrl: '', directionsUrl: '' };
}
