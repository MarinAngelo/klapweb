import { createClient } from '$lib/prismicio';
import { error, redirect } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const token = event.url.searchParams.get('token');
  const documentId = event.url.searchParams.get('documentId');

  if (!token) throw error(400, 'Missing Prismic preview token.');

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  // resolvePreviewURL setzt (via enableAutoPreviews) den Preview-Ref ins Cookie
  const url = await client.resolvePreviewURL({
    previewToken: token,
    documentID: documentId ?? undefined,
    defaultURL: '/',
    // WICHTIG: normale Seite-URLs, nicht /preview/...
    linkResolver: (doc: any) => {
      if (doc?.type === 'page' && doc?.uid === 'home') return '/';
      if (doc?.type === 'page' && doc?.uid) return `/${doc.uid}`;
      return '/';
    }
  });

  // Loop-Killer: Query sicher entfernen
  const u = new URL(url, event.url.origin);
  u.searchParams.delete('token');
  u.searchParams.delete('documentId');
  u.searchParams.delete('websitePreviewId');

  throw redirect(302, u.pathname + u.search + u.hash);
}
