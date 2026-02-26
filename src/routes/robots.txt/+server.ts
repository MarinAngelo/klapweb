import { createClient } from '$lib/prismicio';

export const prerender = true;

export async function GET({ fetch }) {
	const client = createClient({ fetch });

	const repo = await client.getRepository();
	const masterLang = repo.languages.find((l: any) => l.is_master)?.id ?? repo.languages[0].id;

	const settings = await client.getSingle('settings', { lang: masterLang }).catch(() => null);
	const rawDomain = settings?.data?.domain ?? '';
	const baseUrl = (rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`).replace(/\/$/, '');

	const content = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;

	return new Response(content, {
		headers: { 'Content-Type': 'text/plain' }
	});
}
