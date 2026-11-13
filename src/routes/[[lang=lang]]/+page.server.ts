import { redirect, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import smConfig from '../../../slicemachine.config.json';
import { createClient } from '$lib/prismicio';
import { asText, asLink, isFilled } from '@prismicio/client'; // Importiere den Helper

// Der CMS-Redirect muss als HTTP-Redirect ausgeliefert werden, damit Social-Crawler folgen.
export const prerender = false;

// Local dev only: test the real home page without switching the redirect off in Prismic
// (that would trigger a deploy). Production always follows Prismic.
const localRedirectDisabled =
	dev && (smConfig as { home_redirect_disabled?: boolean }).home_redirect_disabled === true;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, parent, fetch, cookies }) {
	// 1. Wir holen die 'lang' vom Layout (Sicherheits-Feature von SvelteKit)
	const { lang, mainLang, settings } = await parent();

	// CMS-controlled home redirect (dev-only override via slicemachine.config.json: home_redirect_disabled)
	const sd = settings?.data as Record<string, unknown>;
	const redirectActive = sd?.home_redirect_active === true;
	const redirectLink = sd?.home_redirect_url as
		| import('@prismicio/client').LinkField
		| null
		| undefined;
	if (redirectActive && !localRedirectDisabled) {
		// No target page chosen → default page «Website im Aufbau» in the visitor's language
		const langPrefix = lang && mainLang && lang !== mainLang ? `/${lang}` : '';
		const redirectUrl = isFilled.link(redirectLink)
			? asLink(redirectLink)
			: `${langPrefix}/im-aufbau`;
		if (redirectUrl) throw redirect(302, redirectUrl);
	}
	// cookies → Prismic-Vorschau (enableAutoPreviews liest das Vorschau-Cookie)
	const client = createClient({ fetch, cookies });

	try {
		const page = await client.getByUID('page', 'home', { lang });

		return {
			page,
			title: asText(page.data.title) || '',
			meta_title: page.data.meta_title || '',
			meta_description: page.data.meta_description
		};
	} catch (e) {
		console.error(`[Page Load Error] Seite 'home' für Sprache ${lang} nicht gefunden.`);
		// Wenn 'home' nicht existiert, werfen wir einen 404
		throw error(404, {
			message: `Startseite 'home' für Sprache ${lang} nicht gefunden.`
		});
	}
}
