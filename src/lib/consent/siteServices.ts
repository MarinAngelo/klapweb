import { createClient } from '$lib/prismicio';
import { consentServices, serviceIdFor, servicesInHtml } from '$lib/consent/services';

/**
 * Detects which registered services the website's CMS content actually uses
 * (embeds, map URLs, external iframes/scripts in HTML code) — basis for the
 * automatically generated service list on the privacy page.
 */
export function detectServicesInContent(documents: unknown[]): string[] {
	const found = new Set<string>();

	function scan(value: unknown, path: string) {
		if (typeof value === 'string') {
			if (/<(iframe|script|embed|object)\b/i.test(value)) {
				servicesInHtml(value).forEach((id) => found.add(id));
			} else if (/map/i.test(path) && /^https?:\/\//i.test(value)) {
				const id = serviceIdFor(value);
				if (id === 'google_maps' || id === 'openstreetmap') found.add(id);
			}
			return;
		}
		if (Array.isArray(value)) {
			value.forEach((item) => scan(item, path));
			return;
		}
		if (value && typeof value === 'object') {
			const record = value as Record<string, unknown>;
			// oEmbed (embed field or rich-text embed node)
			if (typeof record.embed_url === 'string' && typeof record.html === 'string') {
				found.add(serviceIdFor((record.provider_name as string) || record.embed_url));
			}
			for (const [key, child] of Object.entries(record)) scan(child, `${path}.${key}`);
		}
	}

	documents.forEach((doc) => scan((doc as { data?: unknown })?.data, ''));
	return [...found].filter((id) => consentServices[id]);
}

/** Loads all CMS documents and returns the ids of the services used on the website */
export async function loadSiteServices(fetch: typeof globalThis.fetch): Promise<string[]> {
	try {
		const client = createClient({ fetch });
		const documents = await client.dangerouslyGetAll({ lang: '*' });
		return detectServicesInContent(documents);
	} catch (e) {
		console.error('[consent] Dienste konnten nicht ermittelt werden:', e);
		return [];
	}
}
