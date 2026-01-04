import { redirectToPreviewURL } from '@prismicio/svelte/kit';
import { createClient, repositoryName } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const token = event.url.searchParams.get('token');
  const documentId = event.url.searchParams.get('documentId');

  console.log('[preview] repositoryName:', repositoryName);
  console.log('[preview] token present:', Boolean(token), 'documentId:', documentId);

  if (!token) throw error(400, 'Missing Prismic preview token.');

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  // @ts-ignore (nur debug)
  console.log('[preview] prismic endpoint:', client.endpoint);

  try {
    return await redirectToPreviewURL({ client, event });
  } catch (e) {
    console.error('[preview] redirectToPreviewURL failed:', e);
    const msg = e instanceof Error ? e.message : String(e);
    throw error(500, `Preview failed: ${msg}`);
  }
}
