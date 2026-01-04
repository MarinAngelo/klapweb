import { redirectToPreviewURL } from '@prismicio/svelte/kit';
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const token = event.url.searchParams.get('token');
  if (!token) throw error(400, 'Missing Prismic preview token.');

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  // Prismic helper erzeugt einen Redirect (302) mit Location
  const res = await redirectToPreviewURL({ client, event });

  const location = res.headers.get('location');
  if (!location) return res;

  // ✅ Loop-Killer: entferne Preview-Query-Params aus der Ziel-URL
  const u = new URL(location, event.url.origin);
  u.searchParams.delete('token');
  u.searchParams.delete('documentId');
  u.searchParams.delete('websitePreviewId');

  const headers = new Headers(res.headers);
  headers.set('location', u.pathname + u.search + u.hash);

  // Wichtig: Body leer lassen, Status beibehalten (meist 302)
  return new Response(null, { status: res.status, headers });
}
