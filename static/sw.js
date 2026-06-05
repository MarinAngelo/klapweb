const CACHE = 'assets-v1';

const CACHEABLE = [
	'images.prismic.io',
	'use.typekit.net',
	'p.typekit.net',
];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (e) => {
	const req = e.request;
	if (req.method !== 'GET') return;

	// Navigationen immer vom Netz — kein veralteter CMS-Content
	if (req.mode === 'navigate') return;

	const host = new URL(req.url).hostname;
	if (!CACHEABLE.some((h) => host.includes(h))) return;

	e.respondWith(
		caches.open(CACHE).then((cache) =>
			cache.match(req).then((cached) => {
				if (cached) return cached;
				return fetch(req).then((res) => {
					if (res.ok) cache.put(req, res.clone());
					return res;
				});
			})
		)
	);
});
