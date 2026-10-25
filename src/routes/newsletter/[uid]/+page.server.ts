import { error } from '@sveltejs/kit';
import type { PrismicDocument } from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { FEATURE_NEWSLETTER } from '$lib/server/features';
import { brandingFromSettings, renderNewsletter } from '$lib/server/newsletter';

// Web-Ansicht eines Newsletters (auch Ziel der Prismic-Vorschau via /preview/newsletter/<uid>)
export const prerender = false;

export async function load({ params, parent, fetch, cookies, url }) {
	if (!FEATURE_NEWSLETTER) throw error(404, 'Nicht gefunden');
	const { settings, prismicTheme } = await parent();

	// cookies → Prismic-Vorschau (enableAutoPreviews liest das Vorschau-Cookie)
	const client = createClient({ fetch, cookies });
	let doc: PrismicDocument;
	try {
		// Custom type is feature-gated → not part of the generated Prismic types
		doc = await (client as any).getByUID('newsletter', params.uid, { lang: '*' });
	} catch {
		throw error(404, 'Nicht gefunden');
	}

	const mail = renderNewsletter(
		doc as any,
		brandingFromSettings(settings ?? null, prismicTheme ?? null),
		{
			// Example recipient to show how {{Vorname}} etc. are replaced
			recipient: {
				email: 'maria.muster@example.ch',
				vorname: 'Maria',
				nachname: 'Muster',
				firma: 'Muster AG'
			},
			unsubscribeLink: '#',
			linkResolverOrigin: url.origin
		}
	);

	return { subject: mail.subject, html: mail.html, title: mail.subject, no_index: true };
}
