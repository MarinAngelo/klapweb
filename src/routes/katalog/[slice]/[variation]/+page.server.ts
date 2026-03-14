import { error } from '@sveltejs/kit';
import { generateMockSlice } from '$lib/utils/mockSliceData';

export const prerender = false;

const models = import.meta.glob('/src/lib/slices/*/model.json', { eager: true });

export const load = async ({ params }) => {
	const entry = Object.entries(models).find(([path]) =>
		path.includes(`/${params.slice}/model.json`)
	);
	if (!entry) throw error(404, `Slice "${params.slice}" nicht gefunden`);

	const model = entry[1] as any;
	const variation = (model.variations ?? []).find((v: any) => v.id === params.variation);
	if (!variation) throw error(404, `Variation "${params.variation}" nicht gefunden`);

	return {
		sliceId: model.id as string,
		sliceName: model.name as string,
		variationId: variation.id as string,
		variationName: variation.name as string,
		mockSlice: generateMockSlice(model.id, variation)
	};
};
