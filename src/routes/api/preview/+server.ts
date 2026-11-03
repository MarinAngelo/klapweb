import * as prismic from '@prismicio/client';
import { createClient } from '$lib/prismicio.js';

// Same as redirectToPreviewURL from @prismicio/svelte/kit, plus a link resolver for
// document types without a route in prismicio.ts (e.g. newsletter → /newsletter/<uid>).
// Not in the route resolver on purpose: repos without the newsletter type would reject it.
// For all other documents the link resolver returns null → normal route (document.url).
export async function GET({ fetch, request, cookies }) {
	const client = createClient({ fetch });
	const searchParams = new URL(request.url).searchParams;
	const previewToken = searchParams.get('token') ?? undefined;

	const previewURL = await client.resolvePreviewURL({
		previewToken,
		documentID: searchParams.get('documentId') ?? undefined,
		defaultURL: '/',
		linkResolver: (doc) => (doc.type === 'newsletter' && doc.uid ? `/newsletter/${doc.uid}` : null)
	});

	// Prevent a flash of non-preview content by setting the preview token on the initial page load
	if (previewToken) {
		cookies.set(prismic.cookie.preview, previewToken, { path: '/', httpOnly: false });
	}

	return new Response(undefined, { status: 307, headers: { Location: '/preview' + previewURL } });
}
