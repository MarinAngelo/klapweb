import * as prismic from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { error, redirect } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const previewToken = event.url.searchParams.get('token');
  const documentId = event.url.searchParams.get('documentId') ?? undefined;

  if (!previewToken) throw error(400, 'Missing Prismic preview token.');

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  // 1) Preview-Cookie setzen (entscheidend!)
  event.cookies.set(prismic.cookie.preview, previewToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'none',
    secure: true
  });

  // 2) Ziel-URL für das Dokument auflösen
  const previewURL = await client.resolvePreviewURL({
    previewToken,
    documentID: documentId,
    defaultURL: '/',
    // Wichtig: auf deine "normalen" Seiten routen (nicht /preview/...)
    linkResolver: (doc: any) => {
      if (doc?.type === 'page' && doc?.uid === 'home') return '/';
      if (doc?.type === 'page' && doc?.uid) return `/${doc.uid}`;
      return '/';
    }
  });

  // 3) Safety: Query-Params entfernen (damit kein Loop möglich ist)
  const u = new URL(previewURL, event.url.origin);
  u.searchParams.delete('token');
  u.searchParams.delete('documentId');
  u.searchParams.delete('websitePreviewId');

  throw redirect(302, u.pathname + u.search + u.hash);
}
