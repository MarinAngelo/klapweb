import { legalPageKey, staticRoutes } from '$lib/i18n/i18n';
import { t } from '$lib/i18n/translations';
import { loadSiteServices } from '$lib/consent/siteServices';
import type { EntryGenerator, PageLoad } from './$types';

// Page title per legal page (i18n key) → layout renders «Titel | Website-Name» like Prismic pages.
// As meta_title, not title: the layout shows `title` as a visible <h1>, the legal pages have their own
const legalTitles: Record<string, string> = {
	impressum: 'Impressum',
	datenschutz: 'Datenschutz',
	agb: 'Allgemeine Geschäftsbedingungen (AGB)',
	haftungsausschluss: 'Haftungsausschluss'
};

// Legal pages: one route for all slugs and languages (staticRoutes in i18n.ts)
export const load: PageLoad = async ({ params, fetch, parent }) => {
	const legalPage = legalPageKey(params.legal)!;
	const { lang } = await parent();
	return {
		legalPage,
		meta_title: t(legalTitles[legalPage], lang ?? 'de-ch'),
		// Privacy page lists the services used in CMS content automatically
		...(legalPage === 'datenschutz' ? { siteServices: await loadSiteServices(fetch) } : {})
	};
};

// Every slug without language prefix; prefixed variants are reached via the footer links
export const entries: EntryGenerator = () =>
	Object.values(staticRoutes).flatMap((slugs) => Object.values(slugs).map((legal) => ({ legal })));
