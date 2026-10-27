import { asLink } from '@prismicio/client';

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

/**
 * Top-level routes outside src/routes/[[lang=lang]] — they have no /<lang> variant.
 * New route outside [[lang=lang]] → add it here.
 */
const UNLOCALIZED_ROUTES = new Set([
	'admin',
	'agency',
	'api',
	'doku',
	'konto',
	'login',
	'manifest.webmanifest',
	'mietvertrag',
	'newsletter',
	'performance-report',
	'preview',
	'robots.txt',
	'sitemap.xml',
	'slice-preview',
	'slice-simulator',
	'termin-gebucht'
]);

/**
 * Internal link in a secondary language navigation: keep the visitor in that language.
 * '/check-out' in the English navigation → '/en-us/check-out'. Without translation the
 * error page shows the "no translation" notice and redirects to the main language version.
 */
export function localizedPath(url: string, navLang: string, mainLang: string, locales: string[]) {
	if (navLang === mainLang || !url.startsWith('/') || url.startsWith('//')) return url;
	const first = url.split(/[/?#]/)[1] ?? '';
	if (locales.includes(first)) return url; // already has a language prefix
	if (UNLOCALIZED_ROUTES.has(first)) return url; // route without [[lang]] param
	return `/${navLang}${url === '/' ? '' : url}`;
}

/** Navigation document with resolved urls in data.links[].link */
export function withDocumentLinkUrls<T extends { data?: any } | null | undefined>(
	navigation: T,
	mainLang: string,
	navLang: string = mainLang,
	locales: string[] = []
): T {
	const links = navigation?.data?.links;
	if (!Array.isArray(links)) return navigation;
	return {
		...navigation,
		data: {
			...navigation!.data,
			links: links.map((item: any) => {
				const resolved = documentLinkUrl(item?.link, mainLang) ?? item?.link?.url;
				if (!resolved) return item;
				const url = localizedPath(resolved, navLang, mainLang, locales);
				return url === item.link.url ? item : { ...item, link: { ...item.link, url } };
			})
		}
	};
}

/**
 * href of any Prismic link field (Link, Content Relationship, Rich Text hyperlink):
 * Prismic URL or our own for ressource/leistung, then kept in the visitor's language.
 */
export function resolveLinkHref(
	field: unknown,
	lang: string,
	mainLang: string,
	locales: string[]
): string | null {
	const link = field as LinkField | null | undefined;
	const href = documentLinkUrl(link, mainLang || link?.lang || '') ?? asLink(link as any);
	if (!href) return null;
	return lang && mainLang ? localizedPath(href, lang, mainLang, locales) : href;
}
