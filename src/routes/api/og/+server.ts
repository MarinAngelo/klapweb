import { json } from '@sveltejs/kit';

type OgData = { image: string | null; title: string | null };
const cache = new Map<string, OgData>();

function isPrivateHost(hostname: string): boolean {
	return (
		hostname === 'localhost' ||
		hostname.endsWith('.local') ||
		/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)
	);
}

function isGoogleMapsHost(hostname: string): boolean {
	return (
		hostname === 'maps.app.goo.gl' ||
		hostname === 'goo.gl' ||
		hostname === 'maps.google.com' ||
		hostname === 'www.google.com'
	);
}

function extractOgImage(html: string, base: string): string | null {
	const patterns = [
		/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
		/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
		/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
		/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
		/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
	];
	for (const re of patterns) {
		const m = html.match(re);
		if (m?.[1]) {
			const img = m[1];
			if (!img.startsWith('http')) {
				try { return new URL(img, base).href; } catch { continue; }
			}
			return img;
		}
	}
	return null;
}

function extractOgTitle(html: string): string | null {
	const patterns = [
		/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
		/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
		/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
		/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["']/i,
		/<title[^>]*>([^<]+)<\/title>/i,
	];
	for (const re of patterns) {
		const m = html.match(re);
		if (m?.[1]?.trim()) return m[1].split(' · ')[0].trim();
	}
	return null;
}

function extractGoogleMapsImage(html: string): string | null {
	const m = html.match(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s,\\]+/);
	return m ? m[0] : null;
}

export async function GET({ url }) {
	const target = url.searchParams.get('url');
	if (!target) return json({ image: null, title: null });

	let parsed: URL;
	try { parsed = new URL(target); } catch { return json({ image: null, title: null }); }

	if (!['http:', 'https:'].includes(parsed.protocol)) return json({ image: null, title: null });
	if (isPrivateHost(parsed.hostname)) return json({ image: null, title: null });

	if (cache.has(target)) {
		return json(cache.get(target), { headers: { 'Cache-Control': 'public, max-age=86400' } });
	}

	const userAgents = [
		'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
		'WhatsApp/2.23.24.76 A',
		'Twitterbot/1.0',
		'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
	];

	for (const ua of userAgents) {
		try {
			const res = await fetch(target, {
				headers: {
					'User-Agent': ua,
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'Accept-Language': 'de-CH,de;q=0.9,en;q=0.8',
				},
				signal: AbortSignal.timeout(8000),
				redirect: 'follow',
			});
			if (!res.ok) continue;

			const finalUrl = res.url || target;
			const html = await res.text();

			let image = extractOgImage(html, finalUrl);
			if (!image) {
				let finalParsed: URL;
				try { finalParsed = new URL(finalUrl); } catch { finalParsed = parsed; }
				if (isGoogleMapsHost(finalParsed.hostname) || isGoogleMapsHost(parsed.hostname)) {
					image = extractGoogleMapsImage(html);
				}
			}

			const title = extractOgTitle(html);

			if (image || title) {
				const data: OgData = {
					image: image ? `/api/og-proxy?url=${encodeURIComponent(image)}` : null,
					title,
				};
				cache.set(target, data);
				return json(data, { headers: { 'Cache-Control': 'public, max-age=86400' } });
			}
		} catch { /* nächsten UA versuchen */ }
	}

	return json({ image: null, title: null });
}
