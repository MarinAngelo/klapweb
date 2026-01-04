import * as prismic from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { error, redirect } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const previewToken = event.url.searchParams.get('token');
  const documentId = event.url.searchParams.get('documentId') ?? undefined;

  if (!previewToken) throw error(400, 'Missing Prismic preview token.');

  // ✅ Preview-Cookie setzen (cross-site von prismic.io -> deine Domain)
  event.cookies.set(prismic.cookie.preview, previewToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'none',
    secure: true
  });

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  // ✅ Ziel-URL des Preview-Dokuments auflösen
  const target = await client.resolvePreviewURL({
    previewToken,
    documentID: documentId,
    defaultURL: '/',
    // Wichtig: auf deine "normalen" URLs routen
    linkResolver: (doc: any) => {
      if (doc?.type === 'page' && doc?.uid === 'home') return '/';
      if (doc?.type === 'page' && doc?.uid) return `/${doc.uid}`;
      return '/';
    }
  });

  // ✅ Loop-Killer: niemals Query zurückgeben
  const u = new URL(target, event.url.origin);
  throw redirect(302, u.pathname);
}
