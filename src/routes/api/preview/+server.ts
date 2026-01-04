import * as prismic from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { error, redirect } from '@sveltejs/kit';

export const prerender = false;

export async function GET(event) {
  const previewToken = event.url.searchParams.get('token');
  const documentId = event.url.searchParams.get('documentId') ?? undefined;

  if (!previewToken) throw error(400, 'Missing Prismic preview token.');

  // ✅ 1) Preview-Cookie IMMER setzen (das ist bei dir der Blocker)
  event.cookies.set(prismic.cookie.preview, previewToken, {
    path: '/',
    httpOnly: true,
    // Prismic Preview kommt cross-site (prismic.io -> deine domain)
    // Daher: None + secure, sonst wird’s vom Browser verworfen
    sameSite: 'none',
    secure: true
  });

  // ✅ 2) Ziel-URL auflösen
  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  const target = await client.resolvePreviewURL({
    previewToken,
    documentID: documentId,
    defaultURL: '/',
    linkResolver: (doc: any) => {
      if (doc?.type === 'page' && doc?.uid === 'home') return '/';
      if (doc?.type === 'page' && doc?.uid) return `/${doc.uid}`;
      return '/';
    }
  });

  // ✅ 3) token sicher entfernen (Loop-Killer)
  const u = new URL(target, event.url.origin);
  u.searchParams.delete('token');
  u.searchParams.delete('documentId');
  u.searchParams.delete('websitePreviewId');

  throw redirect(302, u.pathname + u.search + u.hash);
}
