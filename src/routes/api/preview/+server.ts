// src/routes/api/preview/+server.ts
import { createClient } from '$lib/prismicio';
import { error, redirect } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const token = event.url.searchParams.get('token');
  const documentId = event.url.searchParams.get('documentId');

  if (!token) throw error(400, 'Missing Prismic preview token.');

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  // Wichtig: wir lösen die URL selbst auf und geben eine defaultURL an
  let url = '/';

  try {
    // Prismic Client API: resolvePreviewURL erwartet previewToken + documentID + linkResolver/defaultURL
    url = await client.resolvePreviewURL({
      previewToken: token,
      documentID: documentId ?? undefined,
      defaultURL: '/',
      // Preview soll bei dir immer unter /preview/... landen:
      linkResolver: (doc: any) => {
        if (doc?.type === 'page' && doc?.uid === 'home') return '/preview';
        if (doc?.type === 'page' && doc?.uid) return `/preview/${doc.uid}`;
        return '/preview';
      }
    });
  } catch (e) {
    // Wenn Prismic resolvePreviewURL hier crasht, lieber sauberer Fehler:
    console.error('resolvePreviewURL failed', e);
    throw error(500, e instanceof Error ? e.message : String(e));
  }

  throw redirect(302, url);
}
