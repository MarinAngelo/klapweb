/**
 * Map URL helpers for the map_url fields (Google Maps or OpenStreetMap).
 * Google URLs are resolved via /api/maps-embed (short links need a server redirect),
 * OpenStreetMap URLs are converted directly in the browser.
 */

export type MapProvider = 'google_maps' | 'openstreetmap';

const OSM_HOSTS = new Set(['openstreetmap.org', 'www.openstreetmap.org', 'osm.org', 'www.osm.org']);

export function getMapProvider(url: string | null | undefined): MapProvider {
	try {
		return OSM_HOSTS.has(new URL(url ?? '').hostname) ? 'openstreetmap' : 'google_maps';
	} catch {
		return 'google_maps';
	}
}

type OsmLocation = { lat: number; lon: number; zoom: number; embedUrl?: string };

/** Reads position from OSM URLs: #map=zoom/lat/lon, ?mlat=&mlon=, export/embed.html?bbox=…&marker=… */
function parseOsmUrl(raw: string): OsmLocation | null {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		return null;
	}
	const params = url.searchParams;
	const hashMatch = url.hash.match(/map=(\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
	const zoom = hashMatch ? Math.round(Number(hashMatch[1])) : Number(params.get('zoom')) || 16;

	// Already an embed URL → keep it, position from marker or bbox centre
	if (url.pathname.includes('/export/embed.html')) {
		const marker = params.get('marker')?.split(',').map(Number);
		const bbox = params.get('bbox')?.split(',').map(Number);
		const lat = marker?.[0] ?? (bbox ? (bbox[1] + bbox[3]) / 2 : NaN);
		const lon = marker?.[1] ?? (bbox ? (bbox[0] + bbox[2]) / 2 : NaN);
		if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
		return { lat, lon, zoom, embedUrl: url.toString() };
	}

	// Marker (?mlat/mlon) is more precise than the visible map centre (#map=)
	const mlat = params.get('mlat');
	const mlon = params.get('mlon');
	if (mlat && mlon) return { lat: Number(mlat), lon: Number(mlon), zoom };
	if (hashMatch) return { lat: Number(hashMatch[2]), lon: Number(hashMatch[3]), zoom };
	return null;
}

function osmEmbedUrl({ lat, lon, zoom }: OsmLocation): string {
	// Visible area for a ~800px wide map at the given zoom level
	const lonSpan = (360 / 2 ** zoom) * 3;
	const latSpan = lonSpan * Math.cos((lat * Math.PI) / 180) * 0.6;
	const bbox = [lon - lonSpan / 2, lat - latSpan / 2, lon + lonSpan / 2, lat + latSpan / 2]
		.map((value) => value.toFixed(6))
		.join(',');
	return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

/** OSM URL → { embedUrl, directionsUrl }, or null if the URL has no position */
export function resolveOsmUrl(raw: string): { embedUrl: string; directionsUrl: string } | null {
	const location = parseOsmUrl(raw);
	if (!location) return null;
	return {
		embedUrl: location.embedUrl ?? osmEmbedUrl(location),
		directionsUrl: `https://www.openstreetmap.org/directions?route=%3B${location.lat}%2C${location.lon}`
	};
}

/** Google Maps URL (resolved) → directions link */
export function googleDirectionsUrl(resolved: string): string {
	if (!resolved) return '';
	// Place name from URL path (more precise than coordinates)
	const placeMatch = resolved.match(/\/maps\/place\/([^/@?]+)/);
	if (placeMatch) {
		const place = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
		return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`;
	}
	const coordMatch = resolved.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
	if (coordMatch) {
		return `https://www.google.com/maps/dir/?api=1&destination=${coordMatch[1]},${coordMatch[2]}`;
	}
	try {
		const q = new URL(resolved).searchParams.get('q');
		if (q) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
	} catch {
		// not a URL
	}
	return '';
}

/**
 * Resolves a map_url field value to an embeddable URL + directions link.
 * Google: short links are resolved server-side via /api/maps-embed.
 */
export async function resolveMapUrl(
	raw: string
): Promise<{ provider: MapProvider; embedUrl: string; directionsUrl: string }> {
	const provider = getMapProvider(raw);
	if (provider === 'openstreetmap') {
		const osm = resolveOsmUrl(raw);
		return { provider, embedUrl: osm?.embedUrl ?? '', directionsUrl: osm?.directionsUrl ?? '' };
	}

	if (raw.includes('google.com/maps/embed') || raw.includes('output=embed')) {
		return { provider, embedUrl: raw, directionsUrl: googleDirectionsUrl(raw) };
	}
	try {
		const res = await fetch(`/api/maps-embed?url=${encodeURIComponent(raw)}`);
		if (res.ok) {
			const data = await res.json();
			return {
				provider,
				embedUrl: data.embedUrl,
				directionsUrl: googleDirectionsUrl(data.resolvedUrl || data.embedUrl)
			};
		}
		// URL rejected / not resolvable → show no map instead of a broken iframe
		return { provider, embedUrl: '', directionsUrl: '' };
	} catch {
		// Network error → try the raw URL
		return { provider, embedUrl: raw, directionsUrl: '' };
	}
}
