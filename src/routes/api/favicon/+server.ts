import type { RequestHandler } from './$types';

/**
 * Favicon of an external website, loaded by our server (replaces google.com/s2/favicons:
 * visitors' IP addresses are no longer sent to Google). Cached in memory and on the CDN.
 *
 * GET /api/favicon?domain=example.com&sz=32
 */

type Icon = { body: ArrayBuffer; type: string };
const cache = new Map<string, Icon | null>();
const MAX_BYTES = 200_000;
const TIMEOUT = 5000;

function isPrivateHost(hostname: string): boolean {
	return (
		hostname === 'localhost' ||
		hostname.endsWith('.local') ||
		hostname.endsWith('.internal') ||
		/^\d+\.\d+\.\d+\.\d+$/.test(hostname) ||
		hostname.includes(':')
	);
}

/** Icon links from the page head, best match for the requested size first */
function iconCandidates(html: string, base: string, size: number): string[] {
	const icons: { href: string; size: number; apple: boolean }[] = [];
	for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
		const rel = tag.match(/\brel=["']([^"']+)["']/i)?.[1].toLowerCase() ?? '';
		if (!/(^|\s)(icon|apple-touch-icon)(\s|$)/.test(rel)) continue;
		const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
		if (!href) continue;
		try {
			const sizes = tag.match(/\bsizes=["'](\d+)x\d+["']/i)?.[1];
			icons.push({
				href: new URL(href, base).href,
				size: sizes ? Number(sizes) : 0,
				apple: rel.includes('apple')
			});
		} catch {
			// invalid href
		}
	}
	// Smallest icon at least as large as requested, then larger ones, then unknown sizes
	const score = (i: (typeof icons)[number]) =>
		i.size >= size ? i.size : i.size ? 10_000 - i.size : 5_000 + (i.apple ? 1 : 0);
	return icons.sort((a, b) => score(a) - score(b)).map((i) => i.href);
}

async function fetchIcon(href: string): Promise<Icon | null> {
	const res = await fetch(href, {
		headers: { 'User-Agent': 'Mozilla/5.0 (compatible; klapweb-favicon)' },
		signal: AbortSignal.timeout(TIMEOUT)
	});
	if (!res.ok || isPrivateHost(new URL(res.url || href).hostname)) return null;
	let type = (res.headers.get('Content-Type') || '').split(';')[0].trim();
	if (!type.startsWith('image/')) {
		if (!/\.ico(\?|$)/i.test(href)) return null;
		type = 'image/x-icon';
	}
	const body = await res.arrayBuffer();
	return body.byteLength > 0 && body.byteLength <= MAX_BYTES ? { body, type } : null;
}

async function loadFavicon(domain: string, size: number): Promise<Icon | null> {
	const candidates: string[] = [];
	try {
		const res = await fetch(`https://${domain}/`, {
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; klapweb-favicon)', Accept: 'text/html' },
			signal: AbortSignal.timeout(TIMEOUT)
		});
		const finalUrl = res.url || `https://${domain}/`;
		if (res.ok && !isPrivateHost(new URL(finalUrl).hostname)) {
			const html = (await res.text()).slice(0, 200_000);
			candidates.push(...iconCandidates(html, finalUrl, size));
		}
	} catch {
		// page not reachable → try /favicon.ico
	}
	candidates.push(`https://${domain}/favicon.ico`);

	for (const href of candidates.slice(0, 4)) {
		try {
			const icon = await fetchIcon(href);
			if (icon) return icon;
		} catch {
			// next candidate
		}
	}
	return null;
}

export const GET: RequestHandler = async ({ url }) => {
	const domain = (url.searchParams.get('domain') ?? '').trim().toLowerCase().replace(/\.$/, '');
	const size = Math.min(256, Math.max(16, Number(url.searchParams.get('sz')) || 32));
	if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain) || isPrivateHost(domain)) {
		return new Response(null, { status: 400 });
	}

	const key = `${domain}|${size}`;
	if (!cache.has(key)) cache.set(key, await loadFavicon(domain, size));
	const icon = cache.get(key);

	if (!icon) {
		return new Response(null, {
			status: 404,
			headers: { 'Cache-Control': 'public, max-age=86400' }
		});
	}
	return new Response(icon.body, {
		headers: {
			'Content-Type': icon.type,
			'Cache-Control': 'public, max-age=604800',
			'Netlify-CDN-Cache-Control': 'public, s-maxage=2592000, durable',
			// SVG icons must not run scripts when the URL is opened directly
			'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
