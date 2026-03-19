import { error } from '@sveltejs/kit';
import { generateMockSlice } from '$lib/utils/mockSliceData';

export const prerender = false;

const models = import.meta.glob('/src/lib/slices/*/model.json', { eager: true });
const bases = import.meta.glob('/src/lib/slices/*/base.json', { eager: true });
const gatingFiles = import.meta.glob('/gating.json', { eager: true });
const gating = Object.values(gatingFiles)[0] as any;

function resolveGateLabel(gate: any): string | null {
	if (!gate) return null;
	if (gate.plan) return gating.plans?.[gate.plan]?.label ?? null;
	if (gate.feature) {
		const planId = gating.features?.[gate.feature]?.plans?.[0];
		return planId ? (gating.plans?.[planId]?.label ?? null) : null;
	}
	return null;
}

export const load = async ({ params }) => {
	const entry = Object.entries(models).find(([path]) =>
		path.includes(`/${params.slice}/model.json`)
	);
	if (!entry) throw error(404, `Slice "${params.slice}" nicht gefunden`);

	const model = entry[1] as any;
	const variation = (model.variations ?? []).find((v: any) => v.id === params.variation);
	if (!variation) throw error(404, `Variation "${params.variation}" nicht gefunden`);

	const basePath = `/src/lib/slices/${params.slice}/base.json`;
	const sliceGating = gating.slices?.[params.slice];
	const varGate = sliceGating?.variations?.[params.variation];
	const sliceLevelGate =
		sliceGating?.plan || sliceGating?.feature
			? { plan: sliceGating.plan, feature: sliceGating.feature }
			: null;
	const gateLabel = resolveGateLabel(varGate) ?? resolveGateLabel(sliceLevelGate);

	const meta = {
		Paket: 'Basis',
		...((bases[basePath] as any)?._meta ?? {}),
		...(gateLabel ? { Paket: gateLabel } : {})
	};

	return {
		sliceId: model.id as string,
		sliceName: model.name as string,
		variationId: variation.id as string,
		variationName: variation.name as string,
		mockSlice: generateMockSlice(model.id, variation),
		meta
	};
};
