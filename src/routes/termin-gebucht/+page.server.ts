import type { PageServerLoad } from './$types';
import { createClient } from '$lib/prismicio';

// Die Seite liest Query-Parameter ($page.url.searchParams) — darf nicht
// prerendert werden, sonst schlägt der Build fehl.
export const prerender = false;

export const load: PageServerLoad = async ({ fetch }) => {
	let successTitle = 'Termin gebucht';
	try {
		const client = createClient({ fetch });
		const settings = await client.getSingle('settings');
		const s = settings.data as any;
		successTitle = (s.booking_success_title as string) || successTitle;
	} catch {
		// Fallback wenn CMS nicht erreichbar
	}
	return { successTitle };
};
