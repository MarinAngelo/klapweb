import { asText } from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { error } from '@sveltejs/kit';

export const prerender = false;

export async function load(event) {
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
    throw error(404, 'Page not found');
  }
}
