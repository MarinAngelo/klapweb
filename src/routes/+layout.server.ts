import { createClient } from '$lib/prismicio';

export const prerender = false;

export async function load(event) {
  const client = createClient({ fetch: event.fetch, cookies: event.cookies });

  // Passe die Single-Types an, falls sie bei dir anders heißen:
  const settings = await client.getSingle('settings');
  const navigation = await client.getSingle('navigation');
  const theme = await client.getSingle('theme');

  return {
    settings,
    navigation,
    theme
  };
}
