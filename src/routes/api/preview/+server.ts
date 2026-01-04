import { redirectToPreviewURL } from '@prismicio/svelte/kit';
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const token = event.url.searchParams.get('token');
  if (!token) throw error(400, 'Missing Prismic preview token.');

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  try {
    // Wichtig: nichts am Response “umbauen”
    return await redirectToPreviewURL({ client, event });
  } catch (e) {
    console.error('Preview endpoint failed:', e);
    const msg = e instanceof Error ? e.message : String(e);
    throw error(500, `Preview failed: ${msg}`);
  }
}
