import { redirectToPreviewURL } from '@prismicio/svelte/kit';
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const token = event.url.searchParams.get('token');
  if (!token) throw error(400, 'Missing Prismic preview token.');

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });
  return redirectToPreviewURL({ client, event });
}
