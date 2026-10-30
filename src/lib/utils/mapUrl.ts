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
	pointFromGoogleUrl
} from '$lib/mapPoint.js';

/** Map provider for the consent banner — always OpenStreetMap now */
export type MapProvider = 'openstreetmap';

export function getMapProvider(_url?: string | null): MapProvider {
	return 'openstreetmap';
}

/**
 * Resolves a «Kartenpunkt» value to an OpenStreetMap embed + directions link.
 * Not understood (e.g. Google place link without coordinates) → empty strings → no map.
 */
export async function resolveMapUrl(
	raw: string
): Promise<{ provider: MapProvider; embedUrl: string; directionsUrl: string }> {
	let point = parseMapPoint(raw);
	if (!point && isGoogleShortLink(raw)) {
		try {
			const res = await fetch(`/api/maps-embed?url=${encodeURIComponent(raw.trim())}`);
			if (res.ok) {
				const data = await res.json();
				point = pointFromGoogleUrl(data.resolvedUrl ?? '');
			}
		} catch {
			// network error → no map
		}
	}
	return point
		? {
				provider: 'openstreetmap',
				embedUrl: osmEmbedUrl(point),
				directionsUrl: osmDirectionsUrl(point)
			}
		: { provider: 'openstreetmap', embedUrl: '', directionsUrl: '' };
}
