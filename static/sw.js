// Retired service worker (formerly cached Prismic images / web fonts).
// Two service workers on the same scope (this one + SvelteKit's /service-worker.js) replaced
// each other on every page load → hanging requests. Visitors who still have it installed get
// this version on their next visit: it deletes its cache and unregisters itself.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.delete('assets-v1')
			.then(() => self.registration.unregister())
			.then(() => self.clients.matchAll())
			.then((clients) => clients.forEach((client) => client.navigate(client.url)))
	);
});
