import type { RequestHandler } from './$types';

const ALLOWED_HOSTS = [
	'lh3.googleusercontent.com',
	'lh4.googleusercontent.com',
	'lh5.googleusercontent.com',
	'lh6.googleusercontent.com',
];

export const GET: RequestHandler = async ({ url }) => {
	const imageUrl = url.searchParams.get('url');
	if (!imageUrl) return new Response(null, { status: 400 });

	let parsed: URL;
	try { parsed = new URL(imageUrl); } catch { return new Response(null, { status: 400 }); }

	if (!ALLOWED_HOSTS.includes(parsed.hostname)) return new Response(null, { status: 403 });

	try {
		const res = await fetch(imageUrl, {
			headers: { 'User-Agent': 'Mozilla/5.0' },
			signal: AbortSignal.timeout(8000),
		});
		if (!res.ok) return new Response(null, { status: res.status });

		return new Response(res.body, {
			headers: {
				'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
				'Cache-Control': 'public, max-age=86400',
			},
		});
	} catch {
		return new Response(null, { status: 502 });
	}
};
