import { createClient } from '$lib/prismicio';
import generatedFieldReference from '$lib/generated/prismic-field-reference.json';

export interface PrismicFieldReferenceItem {
	name: string;
	elementType: 'Page Type' | 'Custom Type' | 'Slice';
	customType: string;
	customTypeLabel?: string;
	tab: string;
	field: string;
	path: string;
	label: string;
	description: string;
	type: string;
}

export async function load({ fetch, parent, params }) {
	const { lang } = await parent();
	const client = createClient({ fetch });
	const fields = generatedFieldReference as PrismicFieldReferenceItem[];

	let pageDocument = null;
	try {
		pageDocument = await client.getByUID('page', 'prismic-feldreferenz', { lang });
	} catch {
		pageDocument = null;
	}

	return {
		lang,
		uri: 'prismic-feldreferenz',
		title: 'Prismic-Feldreferenz',
		fields,
		pageDocument
	};
}
