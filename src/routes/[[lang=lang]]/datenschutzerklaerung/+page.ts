import { loadSiteServices } from '$lib/consent/siteServices';
import type { PageLoad } from './$types';

// Universal load (no server function): services used in CMS content → automatic list on the privacy page
export const load: PageLoad = async ({ fetch }) => ({
	siteServices: await loadSiteServices(fetch)
});
