/// <reference no-default-lib="true" />
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

const CACHE_NAME = `cache-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			cache.addAll(ASSETS);
		})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			);
		})
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== 'GET') return;

	// Skip external domains (typekit, google fonts, etc.)
	if (url.origin !== self.location.origin) {
		event.respondWith(
			fetch(request).catch(() => {
				// Return offline response or empty response
				return new Response('Offline', { status: 503 });
			})
		);
		return;
	}

	// For internal assets, use cache-first strategy
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(
			caches.match(request).then((cached) => {
				return cached || fetch(request);
			})
		);
		return;
	}

	// For everything else, use network-first strategy
	event.respondWith(
		fetch(request)
			.then((response) => {
				if (!response || response.status !== 200) {
					return response;
				}
				const cache = caches.open(CACHE_NAME);
				cache.then((c) => c.put(request, response.clone()));
				return response;
			})
			.catch(() => {
				return caches.match(request) || new Response('Offline', { status: 503 });
			})
	);
});
