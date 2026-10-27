/**
 * URLs for document links to custom types outside the Prismic Route Resolver.
 *
 * Gated types (ressource, leistung) must not be in the Route Resolver: repositories without
 * the type reject every query. Prismic then returns these links without `url` — we build it
 * from type, uid and lang, matching the SvelteKit routes.
 * Link targets are enabled per feature in gating.json (features.<feature>.linkTargets).
 */

/** Custom type → route prefix (src/routes/[[lang=lang]]/<prefix>/[uid]) */
const ROUTE_PREFIX: Record<string, string> = {
	ressource: '/ressource',
	leistung: '/leistung'
};

type LinkField = {
	link_type?: string;
	type?: string;
	uid?: string;
	lang?: string;
	url?: string | null;
	[key: string]: unknown;
};

/** URL for a document link without url, or null if the type has no own route */
export function documentLinkUrl(link: LinkField | null | undefined, mainLang: string) {
	if (!link || link.link_type !== 'Document' || link.url || !link.uid || !link.type) return null;
	const prefix = ROUTE_PREFIX[link.type];
	if (!prefix) return null;
	const langPrefix = link.lang && link.lang !== mainLang ? `/${link.lang}` : '';
	return `${langPrefix}${prefix}/${link.uid}`;
}

/** Navigation document with resolved urls in data.links[].link */
export function withDocumentLinkUrls<T extends { data?: any } | null | undefined>(
	navigation: T,
	mainLang: string
): T {
	const links = navigation?.data?.links;
	if (!Array.isArray(links)) return navigation;
	return {
		...navigation,
		data: {
			...navigation!.data,
			links: links.map((item: any) => {
				const url = documentLinkUrl(item?.link, mainLang);
				return url ? { ...item, link: { ...item.link, url } } : item;
			})
		}
	};
}
