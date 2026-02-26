import { createClient } from '$lib/prismicio';

export const prerender = true;

export async function GET({ fetch }) {
	const client = createClient({ fetch });

	const repo = await client.getRepository();
	const masterLang = repo.languages.find((l: any) => l.is_master)?.id ?? repo.languages[0].id;

	const settings = await client.getSingle('settings', { lang: masterLang }).catch(() => null);
	const isMultilang = settings?.data?.show_language_switcher ?? false;
	const rawDomain = settings?.data?.domain ?? '';
	const baseUrl = (rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`).replace(/\/$/, '');

	const allPages = await client.getAllByType('page', { lang: '*' }).catch(() => []);

	const urls = allPages
		.filter((page) => !page.data?.no_index)
		.filter((page) => isMultilang || page.lang === masterLang)
		.map((page) => {
			const isMainLang = page.lang === masterLang;
			const langPrefix = isMainLang ? '' : `/${page.lang}`;
			const slug = page.uid === 'home' ? '/' : `/${page.uid}`;
			const loc = `${baseUrl}${langPrefix}${slug}`;
			const lastmod = new Date(page.last_publication_date).toISOString().split('T')[0];
			return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
}
