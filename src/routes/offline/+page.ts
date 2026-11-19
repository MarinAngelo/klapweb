// Offline page of the service worker (feature pwa): prerendered, cached on install,
// shown for page requests without network and without a cached copy
export const prerender = true;

export function load() {
	return { no_index: true };
}
