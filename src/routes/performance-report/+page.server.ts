import { createClient } from '$lib/prismicio';
import { asText } from '@prismicio/client';

export async function load({ fetch }: { fetch: typeof globalThis.fetch }) {
	const client   = createClient({ fetch });
	const settings = await client.getSingle('settings').catch(() => null);

	const rawDomain = (settings?.data as any)?.domain ?? '';
	const domain    = rawDomain
		? (rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`).replace(/\/$/, '')
		: '';

	const siteName = (settings?.data as any)?.site_name
		|| asText((settings?.data as any)?.site_title)
		|| '';

	return { domain, siteName };
}
