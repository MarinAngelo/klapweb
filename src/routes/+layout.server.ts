import { createClient } from '$lib/prismicio';
import { isLanguage, defaultLang, languages } from '$lib/i18n/i18n';

export const prerender = 'auto';

export async function load({ fetch, cookies, url }) {
	const client = createClient({ fetch, cookies });

	const [, firstSegment] = url.pathname.split('/');
	const lang = isLanguage(firstSegment) ? firstSegment : defaultLang;

	// Wir laden Settings und Navigation dynamisch basierend auf der Sprache.
	// Das Theme hingegen laden wir FEST mit der defaultLang (z.B. 'de-ch').
	const [settings, navigation, prismicTheme, fonts] = await Promise.all([
		client.getSingle('settings', { lang }),
		client.getSingle('navigation', { lang }),
		client.getSingle('theme', { lang: defaultLang }), // IMMER Standard-Sprache
		client.getAllByType('font') // Fonts sind meistens auch global
	]);

	return {
		settings,
		navigation,
		prismicTheme,
		fonts,
		lang,
		locales: languages
	};
}
