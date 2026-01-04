import { asText } from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { redirect, error } from '@sveltejs/kit';

export const prerender = false;

export async function load(event) {
  const token = event.url.searchParams.get('token');

  // ✅ Wenn Prismic token an /preview/... hängt: sofort zu /api/preview
  if (token) {
    throw redirect(302, `/api/preview?${event.url.searchParams.toString()}`);
  }

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  try {
    const page = await client.getByUID('page', event.params.uid);

    return {
      page,
      title: asText(page.data.title),
      meta_description: page.data.meta_description,
      meta_title: page.data.meta_title,
      meta_image: page.data.meta_image.url,
      no_index: page.data.no_index
    };
  } catch {
    // ✅ verhindert 500 bei unbekannter UID
    throw error(404, 'Page not found');
  }
}
