import { createClient } from '$lib/prismicio';

export const prerender = false;

export async function load(event) {
  event.setHeaders({
    'cache-control': 'no-store'
  });

  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  const settings = await client.getSingle('settings');
  const navigation = await client.getSingle('navigation');
  const prismicTheme = await client.getSingle('theme');
  const fonts = await client.getAllByType('font');

  return {
    settings,
    navigation,
    prismicTheme,
    fonts
  };
}
