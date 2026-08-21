import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createClient } from '$lib/prismicio';
import { asText } from '@prismicio/client';
import { env } from '$env/dynamic/private';

export const prerender = false;

function checkAuth(url: URL) {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
}

export const load: PageServerLoad = async ({ url, fetch }) => {
	checkAuth(url);

	const client = createClient({ fetch });

	// Alle Seiten mit password_protected = true laden
	const allPages = await client.getAllByType('page', { lang: '*', pageSize: 100 }).catch(() => []);

	const protected_ = allPages
		.filter((p) => (p.data as any).password_protected === true)
		.map((p) => ({
			uid: p.uid,
			lang: p.lang,
			title: asText((p.data as any).title) || p.uid,
			id: p.id
		}));

	return { secret: url.searchParams.get('secret')!, pages: protected_ };
};
