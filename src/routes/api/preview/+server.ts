import { redirectToPreviewURL } from '@prismicio/svelte/kit';
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const token = event.url.searchParams.get('token');
  if (!token) throw error(400, 'Missing Prismic preview token.');

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  const res = await redirectToPreviewURL({ client, event });

  const location = res.headers.get('location');
  if (!location) return res;

  // ✅ Location bereinigen (token raus), aber ORIGINAL-Response behalten (Set-Cookie bleibt!)
  const u = new URL(location, event.url.origin);
  u.searchParams.delete('token');
  u.searchParams.delete('documentId');
  u.searchParams.delete('websitePreviewId');

  res.headers.set('location', u.pathname + u.search + u.hash);
  return res;
}
