import type { RequestHandler } from './$types';

function isPrivateHost(hostname: string): boolean {
	return (
		hostname === 'localhost' ||
		hostname.endsWith('.local') ||
		/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)
	);
}

export const GET: RequestHandler = async ({ url }) => {
	const imageUrl = url.searchParams.get('url');
	if (!imageUrl) return new Response(null, { status: 400 });

	let parsed: URL;
	try {
		parsed = new URL(imageUrl);
	} catch {
		return new Response(null, { status: 400 });
	}

	if (!['http:', 'https:'].includes(parsed.protocol)) return new Response(null, { status: 403 });
	if (isPrivateHost(parsed.hostname)) return new Response(null, { status: 403 });

	try {
		const res = await fetch(imageUrl, {
			headers: { 'User-Agent': 'Mozilla/5.0' },
			signal: AbortSignal.timeout(8000)
		});
		if (!res.ok) return new Response(null, { status: res.status });

		const contentType = res.headers.get('Content-Type') || '';
		if (!contentType.startsWith('image/')) return new Response(null, { status: 403 });

		return new Response(res.body, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400'
			}
		});
	} catch {
		return new Response(null, { status: 502 });
	}
};
