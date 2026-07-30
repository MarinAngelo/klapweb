import { redirect } from '@sveltejs/kit';
import type { LayoutServerData } from './$types';

export const prerender = false;

export async function load({
	parent,
	params
}: {
	parent: () => Promise<LayoutServerData>;
	params: Record<string, string>;
}) {
	const { katalogSlices } = await parent();
	const first = katalogSlices?.[0];
	if (first) {
		const langPrefix = params.lang ? `/${params.lang}` : '';
		throw redirect(302, `${langPrefix}/katalog/${first.dirName}/${first.variations[0].id}`);
	}
	return {};
}
