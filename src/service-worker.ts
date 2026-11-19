/// <reference no-default-lib="true" />
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

const CACHE_NAME = `cache-${version}`;
const ASSETS = new Set([...build, ...files]);
/** Shown for page requests without network and without a cached copy (src/routes/offline) */
const OFFLINE_PAGE = '/offline';
/** Stored on install so they also work offline on a first-time-offline visit */
const PRECACHE_PAGES = [OFFLINE_PAGE, '/', '/kontakt'];
/** Slow network: after this time a cached copy is shown (the network keeps updating the cache) */
const NETWORK_TIMEOUT_MS = 3000;

/** Store pages that exist and are not redirects (home may redirect, «Kontakt» may not exist) */
async function precachePages(cache: Cache) {
	await Promise.all(
		PRECACHE_PAGES.map(async (path) => {
			try {
				const response = await fetch(path);
				if (response.ok && !response.redirected) await cache.put(path, response);
			} catch {
				// offline during install: try again with the next service worker version
			}
		})
	);
}

/** Network first; after NETWORK_TIMEOUT_MS the cached copy, offline the cache or the offline page */
async function networkFirst(event: FetchEvent, request: Request): Promise<Response> {
	const cache = await caches.open(CACHE_NAME);
	const network = fetch(request).then((response) => {
		if (response.ok && !response.redirected) cache.put(request, response.clone());
		return response;
	});
	try {
		const timeout = new Promise<'timeout'>((resolve) =>
			setTimeout(() => resolve('timeout'), NETWORK_TIMEOUT_MS)
		);
		const winner = await Promise.race([network, timeout]);
		if (winner !== 'timeout') return winner;
		const cached = await cache.match(request);
		if (cached) {
			event.waitUntil(network.catch(() => undefined));
			return cached;
		}
		return await network;
	} catch {
		const cached = await cache.match(request);
		if (cached) return cached;
		if (request.mode === 'navigate') {
			const offline = await cache.match(OFFLINE_PAGE);
			if (offline) return offline;
		}
		return new Response('Offline', { status: 503 });
	}
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => Promise.all([cache.addAll([...ASSETS]), precachePages(cache)]))
	);
	// Neuer SW übernimmt sofort, ohne auf Tab-Schließen zu warten
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
			)
			.then(() => self.clients.claim()) // alle offenen Tabs sofort übernehmen
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Nur GET-Requests behandeln
	if (request.method !== 'GET') return;

	// Prismic images (formerly /sw.js): cache-first, URLs incl. size parameters do not change
	if (url.hostname === 'images.prismic.io') {
		event.respondWith(
			caches.open(CACHE_NAME).then((cache) =>
				cache.match(request).then(
					(cached) =>
						cached ??
						fetch(request).then((response) => {
							if (response.ok) cache.put(request, response.clone());
							return response;
						})
				)
			)
		);
		return;
	}

	// Externe Domains nicht abfangen – Browser handhabt diese direkt
	if (url.origin !== self.location.origin) return;

	// Statische Assets: Cache-First
	if (ASSETS.has(url.pathname)) {
		event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
		return;
	}

	// Alles andere (Seiten, Daten): Network-First mit Zeitlimit, Cache und Offline-Seite
	event.respondWith(networkFirst(event, request));
});
