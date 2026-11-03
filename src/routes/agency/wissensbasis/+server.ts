import { error } from '@sveltejs/kit';
import { isAgencyAuthenticated } from '$lib/server/agencyAuth';
// Bundled at build time — the file stays out of static/ (must not be public)
import knowledgeBase from '../../../../docs/chatbot-wissensbasis.html?raw';

export const prerender = false;

/** Generated chat bot knowledge base (docs/chatbot-wissensbasis.html), agency login only */
export const GET = ({ cookies }) => {
	if (!isAgencyAuthenticated(cookies)) throw error(403, 'Nicht authentifiziert');
	return new Response(knowledgeBase, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'private, no-store',
			'X-Robots-Tag': 'noindex'
		}
	});
};
