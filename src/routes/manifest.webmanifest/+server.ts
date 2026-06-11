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

	const name = asText(data?.site_title) || data?.site_name || 'App';
	const themeColor = data?.pwa_theme_color || themeData?.page_bg_color || '#ffffff';

	// Imgix unterstützt fm=png → wir erzwingen PNG für Lighthouse-Kompatibilität
	function squareIcon(url: string | undefined, size: number): string | null {
		if (!url) return null;
		try {
			const u = new URL(url);
			u.searchParams.set('w',   String(size));
			u.searchParams.set('h',   String(size));
			u.searchParams.set('fit', 'crop');
			u.searchParams.set('fm',  'png');
			return u.toString();
		} catch { return null; }
	}

	const icon512src = data?.app_icon?.url
		? squareIcon(data.app_icon.url, 512)
		: squareIcon(data?.meta_image?.url, 512);

	const icon192src = squareIcon(data?.app_icon?.url ?? data?.meta_image?.url, 192);

	type ManifestIcon = { src: string; sizes: string; type: string; purpose?: string };
	const icons: ManifestIcon[] = [];

	if (icon192src) icons.push({ src: icon192src, sizes: '192x192', type: 'image/png', purpose: 'any' });
	if (icon512src) {
		icons.push({ src: icon512src, sizes: '512x512', type: 'image/png', purpose: 'any' });
		icons.push({ src: icon512src, sizes: '512x512', type: 'image/png', purpose: 'maskable' });
	}

	const manifest = {
		name,
		short_name: name,
		start_url: '/',
		scope: '/',
		display: 'standalone',
		background_color: themeColor,
		theme_color: themeColor,
		icons,
	};

	return new Response(JSON.stringify(manifest, null, '\t'), {
		headers: { 'Content-Type': 'application/manifest+json' },
	});
}
