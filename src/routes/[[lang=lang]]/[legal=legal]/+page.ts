import { legalPageKey, staticRoutes } from '$lib/i18n/i18n';
import { loadSiteServices } from '$lib/consent/siteServices';
import type { EntryGenerator, PageLoad } from './$types';

// Legal pages: one route for all slugs and languages (staticRoutes in i18n.ts)
export const load: PageLoad = async ({ params, fetch }) => {
	const legalPage = legalPageKey(params.legal)!;
	return {
		legalPage,
		// Privacy page lists the services used in CMS content automatically
		...(legalPage === 'datenschutz' ? { siteServices: await loadSiteServices(fetch) } : {})
	};
};

// Every slug without language prefix; prefixed variants are reached via the footer links
export const entries: EntryGenerator = () =>
	Object.values(staticRoutes).flatMap((slugs) => Object.values(slugs).map((legal) => ({ legal })));
