/// <reference no-default-lib="true" />
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

const CACHE_NAME = `cache-${version}`;
const ASSETS = new Set([...build, ...files]);

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([...ASSETS])));
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

	// Externe Domains nicht abfangen – Browser handhabt diese direkt
	if (url.origin !== self.location.origin) return;

	// Statische Assets: Cache-First
	if (ASSETS.has(url.pathname)) {
		event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
		return;
	}

	// Alles andere: Network-First mit Cache-Fallback
	event.respondWith(
		fetch(request)
			.then((response) => {
				if (response.ok) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((c) => c.put(request, clone));
				}
				return response;
			})
			.catch(async () => {
				const cached = await caches.match(request);
				return cached ?? new Response('Offline', { status: 503 });
			})
	);
});
