// src/routes/api/preview/+server.ts
import { redirectToPreviewURL } from '@prismicio/svelte/kit';
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const url = new URL(event.request.url);
  const token = url.searchParams.get('token');

  // Wichtig: Ohne token NICHT weiter-redirecten (Loop verhindern)
  if (!token) {
    throw error(400, 'Missing Prismic preview token.');
  }

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });
  return await redirectToPreviewURL({ client, event });
}
