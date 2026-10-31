import type { PageServerLoad } from './$types';
import { createClient } from '$lib/prismicio';
import { asText } from '@prismicio/client';

export const prerender = false;

export const load: PageServerLoad = async ({ fetch }) => {
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

	return { pages: protected_ };
};
