/**
 * «Kartenpunkt» fields (map_url, location_map_url, geo_koordinaten, map_point): one input
 * format everywhere — a link or plain coordinates — always shown as OpenStreetMap.
 *
 * Accepted:
 *   - Coordinates: "47.3769, 8.5417", "47.3769 8.5417", "47.3769° N, 8.5417° E"
 *   - Geo URI: geo:47.3769,8.5417?z=17 (OSM «Teilen» → «Geo-URI»)
 *   - OpenStreetMap: #map=zoom/lat/lon, ?mlat=&mlon=, export/embed.html, short link osm.org/go/…
 *   - Embed code <iframe src="…"> of any of these (e.g. Google «Karte einbetten»)
 *   - Google Maps: links with coordinates (@lat,lon / !3d…!4d… / ?q=lat,lon); short links
 *     (maps.app.goo.gl) are resolved server-side: resolveGoogleShortLink (browser: /api/maps-embed)
 *   - Apple Maps: maps.apple.com/?ll=lat,lon (or sll / q=lat,lon)
 *   - swisstopo: map.geo.admin.ch (Swiss coordinates LV95 / LV03 → WGS84)
 *
 * Plain JS: used by the app (src/lib/utils/mapUrl.ts) and scripts (content check).
 */

/** @typedef {{ lat: number; lon: number; zoom: number }} MapPoint */

const DEFAULT_ZOOM = 16;
const OSM_HOSTS = ['openstreetmap.org', 'www.openstreetmap.org', 'osm.org', 'www.osm.org'];

const valid = (/** @type {number} */ lat, /** @type {number} */ lon) =>
	Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

/** @param {number} lat @param {number} lon @param {number} [zoom] @returns {MapPoint | null} */
const point = (lat, lon, zoom = DEFAULT_ZOOM) =>
	valid(lat, lon) ? { lat, lon, zoom: Math.max(1, Math.min(19, Math.round(zoom))) } : null;

/** "47.3769, 8.5417" / "47.3769° N, 8.5417° E" / "47.3769 8.5417" */
function parseCoordinates(/** @type {string} */ raw) {
	const m = raw
		.trim()
		.match(
			/^(-?\d{1,2}(?:\.\d+)?)\s*°?\s*([NS])?\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([EOW])?$/i
		);
	if (!m) return null;
	const lat = Number(m[1]) * (/s/i.test(m[2] ?? '') ? -1 : 1);
	const lon = Number(m[3]) * (/w/i.test(m[4] ?? '') ? -1 : 1);
	return point(lat, lon);
}

/** Swiss coordinates (LV95 E/N or LV03 y/x) → WGS84, swisstopo approximation (≈1 m) */
function swissToWgs84(/** @type {number} */ e, /** @type {number} */ n) {
	// LV03 values are 2'000'000 / 1'000'000 smaller than LV95
	const y = ((e > 1e6 ? e - 2e6 : e) - 600000) / 1e6;
	const x = ((n > 1e6 ? n - 1e6 : n) - 200000) / 1e6;
	const lon = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y ** 3;
	const lat =
		16.9023892 +
		3.238272 * x -
		0.270978 * y * y -
		0.002528 * x * x -
		0.0447 * y * y * x -
		0.014 * x ** 3;
	return point((lat * 100) / 36, (lon * 100) / 36);
}

/** OSM short link code (osm.org/go/<code>), same algorithm as openstreetmap.org */
function decodeOsmShortLink(/** @type {string} */ code) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_~';
	const sc = code.replace(/@/g, '~');
	let x = 0;
	let y = 0;
	let z = -8;
	let i = 0;
	for (; i < sc.length; i++) {
		const digit = chars.indexOf(sc[i]);
		if (digit === -1) break;
		x *= 8;
		y *= 8;
		for (let j = 2; j >= 0; j--) {
			if (digit & (1 << (2 * j + 1))) x += 1 << j;
			if (digit & (1 << (2 * j))) y += 1 << j;
		}
		z += 3;
	}
	if (i === 0) return null;
	if (sc[i] === '-') {
		z -= 2;
		if (sc[i + 1] === '-') z += 1;
	}
	return point(y * 2 ** (2 - 3 * i) * 45 - 90, x * 2 ** (2 - 3 * i) * 90 - 180, z);
}

/** Coordinates contained in a Google Maps URL (after resolving short links) */
export function pointFromGoogleUrl(/** @type {string} */ href) {
	const bang = href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/); // exact place marker
	if (bang) return point(Number(bang[1]), Number(bang[2]));
	// Embed URL (maps/embed?pb=…): !2d = longitude, !3d = latitude, !1d = visible distance in m
	const embed = href.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);
	if (embed) {
		const lat = Number(embed[2]);
		const meters = Number(href.match(/!1d(\d+(?:\.\d+)?)/)?.[1]);
		const zoom = meters
			? Math.log2((40075016 * Math.cos((lat * Math.PI) / 180)) / meters)
			: DEFAULT_ZOOM;
		return point(lat, Number(embed[1]), zoom);
	}
	const at = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)(?:,(\d+(?:\.\d+)?)z)?/);
	if (at) return point(Number(at[1]), Number(at[2]), at[3] ? Number(at[3]) : DEFAULT_ZOOM);
	try {
		const params = new URL(href).searchParams;
		for (const key of ['q', 'query', 'll', 'center', 'destination']) {
			const value = params.get(key);
			const p = value ? parseCoordinates(value) : null;
			if (p) return p;
		}
	} catch {
		// not a URL
	}
	return null;
}

/** Google short link that must be resolved via /api/maps-embed */
export const isGoogleShortLink = (/** @type {string} */ raw) =>
	/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i.test(raw.trim());

/**
 * Server only (browsers block the request): follows a Google short link and reads the
 * coordinates from the long URL it redirects to.
 * @param {string} raw
 * @param {typeof fetch} [fetchFn]
 * @returns {Promise<{ point: MapPoint | null; resolvedUrl: string }>}
 */
export async function resolveGoogleShortLink(raw, fetchFn = fetch) {
	const value = raw.trim();
	if (!isGoogleShortLink(value)) return { point: null, resolvedUrl: value };
	try {
		const res = await fetchFn(value, {
			redirect: 'follow',
			headers: { 'User-Agent': 'Mozilla/5.0' },
			signal: AbortSignal.timeout(8000)
		});
		const resolvedUrl = res.url || value;
		return { point: pointFromGoogleUrl(resolvedUrl), resolvedUrl };
	} catch {
		return { point: null, resolvedUrl: value };
	}
}

/**
 * Parses a «Kartenpunkt» value.
 * @param {string | null | undefined} raw
 * @returns {MapPoint | null}  null = empty or not understood (Google short links: see isGoogleShortLink)
 */
export function parseMapPoint(raw) {
	let value = (raw ?? '').trim();
	if (!value) return null;
	// Pasted embed code (<iframe src="…">): only the src is read
	const iframeSrc = value.match(/^<iframe\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
	if (iframeSrc) value = iframeSrc.replace(/&amp;/g, '&');
	const coords = parseCoordinates(value);
	if (coords) return coords;

	// Geo URI (RFC 5870, OSM «Teilen» → «Geo-URI»): geo:47.3769,8.5417?z=17 / geo:47.3769,8.5417;u=10
	const geo = value.match(
		/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,[-\d.]+)?(?:;[^?]*)?(?:\?(.*))?$/i
	);
	if (geo) {
		const zoom = Number(new URLSearchParams(geo[3] ?? '').get('z')) || DEFAULT_ZOOM;
		return point(Number(geo[1]), Number(geo[2]), zoom);
	}

	let url;
	try {
		url = new URL(value);
	} catch {
		return null;
	}
	const host = url.hostname.toLowerCase();
	const params = url.searchParams;

	if (OSM_HOSTS.includes(host)) {
		const short = url.pathname.match(/^\/go\/([A-Za-z0-9_~@-]+)/);
		if (short) return decodeOsmShortLink(short[1]);
		const hash = url.hash.match(/map=(\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
		const zoom = hash ? Number(hash[1]) : Number(params.get('zoom')) || DEFAULT_ZOOM;
		if (params.get('mlat') && params.get('mlon'))
			return point(Number(params.get('mlat')), Number(params.get('mlon')), zoom);
		const marker = params.get('marker')?.split(',').map(Number);
		if (marker?.length === 2) return point(marker[0], marker[1], zoom);
		const bbox = params.get('bbox')?.split(',').map(Number);
		if (bbox?.length === 4) return point((bbox[1] + bbox[3]) / 2, (bbox[0] + bbox[2]) / 2, zoom);
		if (hash) return point(Number(hash[2]), Number(hash[3]), zoom);
		return null;
	}

	if (/(^|\.)google\.[a-z.]+$/.test(host)) return pointFromGoogleUrl(value);

	if (host === 'maps.apple.com') {
		for (const key of ['ll', 'sll', 'q', 'coordinate']) {
			const v = params.get(key);
			const p = v ? parseCoordinates(v) : null;
			if (p) return p;
		}
		return null;
	}

	if (host.endsWith('geo.admin.ch')) {
		// New viewer: #/map?center=E,N&z=… ; classic: ?E=…&N=… or ?X=…&Y=… (LV03: Y = east)
		const hashParams = new URLSearchParams(url.hash.split('?')[1] ?? '');
		const center = (hashParams.get('center') ?? params.get('center'))?.split(',').map(Number);
		if (center?.length === 2) return swissToWgs84(center[0], center[1]);
		const e = Number(params.get('E') ?? params.get('Y'));
		const n = Number(params.get('N') ?? params.get('X'));
		if (e && n) return swissToWgs84(e, n);
		return null;
	}

	return null;
}

/** Embed URL of an OpenStreetMap map centred on the point (with marker) */
export function osmEmbedUrl(/** @type {MapPoint} */ { lat, lon, zoom }) {
	const lonSpan = (360 / 2 ** zoom) * 3;
	const latSpan = lonSpan * Math.cos((lat * Math.PI) / 180) * 0.6;
	const bbox = [lon - lonSpan / 2, lat - latSpan / 2, lon + lonSpan / 2, lat + latSpan / 2]
		.map((v) => v.toFixed(6))
		.join(',');
	return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

/** Link «Auf der Karte anzeigen» (marker on openstreetmap.org) */
export const osmMarkerUrl = (/** @type {MapPoint} */ { lat, lon }) =>
	`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;

/** Link «Route planen» to the point */
export const osmDirectionsUrl = (/** @type {MapPoint} */ { lat, lon }) =>
	`https://www.openstreetmap.org/directions?route=%3B${lat}%2C${lon}`;

/** Fallback without point: search the address on openstreetmap.org */
export const osmSearchUrl = (/** @type {string} */ query) =>
	`https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
