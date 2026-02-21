import type { RequestHandler } from '@sveltejs/kit';

// Lokaler Fallback-Handler für Formular-Submissions.
// Auf Netlify-Production wird dieser Endpunkt nie erreicht –
// Netlify's CDN fängt den POST ab (wegen form-name=contact in netlify-forms.html).
export const POST: RequestHandler = async () => {
	return new Response(null, { status: 200 });
};
