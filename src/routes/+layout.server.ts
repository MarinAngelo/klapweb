import { createClient } from '$lib/prismicio';

export const prerender = 'auto';

export async function load({ fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	const settings = await client.getSingle('settings');
	const navigation = await client.getSingle('navigation');
	const prismicTheme = await client.getSingle('theme');

	return {
		settings,
		navigation,
		prismicTheme
	};
}
