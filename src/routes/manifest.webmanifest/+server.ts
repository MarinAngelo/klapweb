import { createClient } from '$lib/prismicio';

export const prerender = true;

export async function GET({ fetch }) {
	const client = createClient({ fetch });

	const repo = await client.getRepository();
	const masterLang = repo.languages.find((l: any) => l.is_master)?.id ?? repo.languages[0].id;
	const settings = await client.getSingle('settings', { lang: masterLang }).catch(() => null);

	const data = settings?.data;
	const pwaEnabled = data?.pwa_enabled ?? false;

	if (!pwaEnabled) {
		return new Response(JSON.stringify({ name: '', short_name: '' }), {
			headers: { 'Content-Type': 'application/manifest+json' }
		});
	}

	const rawDomain = data?.domain ?? '';
	const startUrl = (rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`).replace(
		/\/$/,
		''
	);

	const name = data?.pwa_name || data?.site_name || 'App';
	const shortName = data?.pwa_short_name || name;
	const themeColor = data?.pwa_theme_color || '#ffffff';
	const icon512 = data?.pwa_icon?.url;
	const icon192 = data?.pwa_icon?.['192']?.url || icon512;

	const icons = [];
	if (icon192) icons.push({ src: icon192, sizes: '192x192', type: 'image/png' });
	if (icon512) icons.push({ src: icon512, sizes: '512x512', type: 'image/png' });

	const manifest = {
		name,
		short_name: shortName,
		start_url: startUrl || '/',
		display: 'standalone',
		background_color: '#ffffff',
		theme_color: themeColor,
		icons
	};

	return new Response(JSON.stringify(manifest, null, '\t'), {
		headers: { 'Content-Type': 'application/manifest+json' }
	});
}
