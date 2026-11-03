/**
 * Google Maps short links (maps.app.goo.gl) in «Kartenpunkt» fields: the browser cannot follow
 * the redirect itself (CORS), so our server resolves it and returns the coordinates. The map is
 * then shown as OpenStreetMap — no visitor data goes to Google.
 *
 * GET /api/maps-embed?url=https://maps.app.goo.gl/…  →  { point, resolvedUrl }
 */
import { json, error } from '@sveltejs/kit';
import { isGoogleShortLink, resolveGoogleShortLink } from '$lib/mapPoint.js';

export async function GET({ url: reqUrl, fetch }) {
	const rawUrl = reqUrl.searchParams.get('url') ?? '';
	if (!rawUrl) throw error(400, 'url parameter required');
	if (!isGoogleShortLink(rawUrl)) throw error(403, 'URL not allowed');

	const { point, resolvedUrl } = await resolveGoogleShortLink(rawUrl, fetch);
	if (!point) throw error(422, 'Could not resolve map URL');
	return json({ point, resolvedUrl }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
}
