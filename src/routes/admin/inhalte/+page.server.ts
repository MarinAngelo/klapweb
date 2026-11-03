import type { PageServerLoad } from './$types';
import { createClient, repositoryName } from '$lib/prismicio';
import { checkContent } from '$lib/contentCheck.js';

export const prerender = false;

// Same check as scripts/check-translations.js, for editors (live from Prismic)
export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const result = await checkContent(createClient({ fetch }));
		return { ...result, repositoryName, error: null };
	} catch (e) {
		console.error('[admin/inhalte] Prüfung fehlgeschlagen:', e);
		return {
			langs: [],
			master: '',
			missing: [],
			links: [],
			repositoryName,
			error: String(e)
		};
	}
};
