import { json, error } from '@sveltejs/kit';

const ALLOWED_HOSTS = new Set([
	'maps.app.goo.gl',
	'goo.gl',
	'maps.google.com',
	'www.google.com',
	'google.com'
]);

function isAllowedUrl(url: string): boolean {
	try {
		const { hostname } = new URL(url);
		return ALLOWED_HOSTS.has(hostname);
	} catch {
		return false;
	}
}

function toEmbedUrl(url: string): string | null {
	// Already an embed URL
	if (url.includes('google.com/maps/embed')) return url;
	if (url.includes('output=embed')) return url;

	// Extract coordinates: @lat,lng or @lat,lng,zoom
	const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
	if (coordMatch) {
		const lat = coordMatch[1];
		const lng = coordMatch[2];
		return `https://maps.google.com/maps?q=${lat},${lng}&output=embed&z=15`;
	}

	// Extract place name from URL path
	const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/);
	if (placeMatch) {
		const place = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
		return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
	}

	// Fallback: append output=embed for maps.google.com URLs
	if (url.includes('maps.google.com') || url.includes('google.com/maps')) {
		const sep = url.includes('?') ? '&' : '?';
		return url + sep + 'output=embed';
	}

	return null;
}

export async function GET({ url: reqUrl, fetch }) {
	const rawUrl = reqUrl.searchParams.get('url');
	if (!rawUrl) throw error(400, 'url parameter required');
	if (!isAllowedUrl(rawUrl)) throw error(403, 'URL not allowed');

	// Already an embed URL – return immediately
	if (rawUrl.includes('google.com/maps/embed') || rawUrl.includes('output=embed')) {
		return json({ embedUrl: rawUrl, resolvedUrl: rawUrl });
	}

	try {
		// Follow redirects to resolve short URLs (maps.app.goo.gl etc.)
		const response = await fetch(rawUrl, {
			redirect: 'follow',
			headers: { 'User-Agent': 'Mozilla/5.0' }
		});
		const resolvedUrl = response.url || rawUrl;
		const embedUrl = toEmbedUrl(resolvedUrl);
		if (embedUrl) return json({ embedUrl, resolvedUrl });
	} catch {
		// fetch failed – fall through to direct transform
	}

	// Fallback: try converting the raw URL directly
	const fallback = toEmbedUrl(rawUrl);
	if (fallback) return json({ embedUrl: fallback, resolvedUrl: rawUrl });
	throw error(422, 'Could not resolve map URL');
}
