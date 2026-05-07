import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const target = url.searchParams.get('url');
	if (!target) return json({ image: null });

	let parsed: URL;
	try { parsed = new URL(target); } catch { return json({ image: null }); }

	if (!['http:', 'https:'].includes(parsed.protocol)) return json({ image: null });

	// SSRF-Schutz: keine internen Adressen
	const h = parsed.hostname;
	if (
		h === 'localhost' ||
		h.endsWith('.local') ||
		/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)
	) {
		return json({ image: null });
	}

	try {
		const res = await fetch(target, {
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)' },
			signal: AbortSignal.timeout(6000)
		});
		if (!res.ok) return json({ image: null });

		const html = await res.text();

		const imgMatch =
			html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
			html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

		let image = imgMatch?.[1] ?? null;

		// relative URL auflösen
		if (image && !image.startsWith('http')) {
			try { image = new URL(image, target).href; } catch { image = null; }
		}

		return json({ image }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
	} catch {
		return json({ image: null });
	}
}
