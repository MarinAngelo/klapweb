import { createClient } from '$lib/prismicio';
import { asText } from '@prismicio/client';

export const prerender = true;

export async function GET({ fetch }) {
	const client = createClient({ fetch });

	const repo = await client.getRepository();
	const masterLang = repo.languages.find((l: any) => l.is_master)?.id ?? repo.languages[0].id;

	const [settings, themes] = await Promise.all([
		client.getSingle('settings', { lang: masterLang }).catch(() => null),
		client.getAllByType('theme', { lang: '*' }).catch(() => [] as any[]),
	]);

	const data = settings?.data;
	const activeTheme = themes.find((t: any) => t.data?.activ === true) ?? themes[0] ?? null;
	const themeData = activeTheme?.data;

	const rawDomain = data?.domain ?? '';
	const startUrl = (rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`).replace(/\/$/, '');

	const name = asText(data?.site_title) || data?.site_name || 'App';
	const shortName = name;
	const themeColor = data?.pwa_theme_color || themeData?.page_bg_color || '#ffffff';

	function squareIcon(url: string | undefined, size: number): string | null {
		if (!url) return null;
		try {
			const u = new URL(url);
			u.searchParams.set('w', String(size));
			u.searchParams.set('h', String(size));
			u.searchParams.set('fit', 'crop');
			return u.toString();
		} catch { return null; }
	}

	// app_icon hat Prismic-Thumbnails 192×192 und 180×180 (exakt gecroppt)
	// Fallback: meta_image (1200×630) mit quadratischem Crop via URL-Param
	const icon512 = data?.app_icon?.url
		? squareIcon(data.app_icon.url, 512)
		: squareIcon(data?.meta_image?.url, 512);
	const icon192 = data?.app_icon?.['192']?.url
		|| squareIcon(data?.app_icon?.url, 192)
		|| squareIcon(data?.meta_image?.url, 192);

	const icons: { src: string; sizes: string; type: string }[] = [];
	if (icon192) icons.push({ src: icon192, sizes: '192x192', type: 'image/png' });
	if (icon512) icons.push({ src: icon512, sizes: '512x512', type: 'image/png' });

	const manifest = {
		name,
		short_name: shortName,
		start_url: startUrl || '/',
		display: 'standalone',
		background_color: themeColor,
		theme_color: themeColor,
		icons,
	};

	return new Response(JSON.stringify(manifest, null, '\t'), {
		headers: { 'Content-Type': 'application/manifest+json' },
	});
}
