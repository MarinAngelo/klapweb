// Loads all slice models for the sidebar navigation — available to all /katalog/* routes.
export const prerender = false;

const models = import.meta.glob('/src/lib/slices/*/model.json', { eager: true });
const bases = import.meta.glob('/src/lib/slices/*/base.json', { eager: true });
const gatingFiles = import.meta.glob('/gating.json', { eager: true });
const gating = Object.values(gatingFiles)[0] as any;

const SKIP = new Set(['form/kauf', 'image_cards/plaene']);

function resolveRequiredPlan(gate: any): string | null {
	if (!gate) return null;
	if (gate.plan) return gate.plan;
	if (gate.feature) return gating.features?.[gate.feature]?.plans?.[0] ?? null;
	return null;
}

export const load = async () => {
	const plans = Object.entries(gating.plans as Record<string, any>).map(([id, p]) => ({
		id,
		label: p.label as string,
		extends: p.extends as string | undefined
	}));

	const katalogSlices = Object.entries(models)
		.map(([path, model]: [string, any]) => {
			const dirName = path.match(/\/slices\/([^/]+)\/model\.json/)?.[1] ?? '';
			const basePath = `/src/lib/slices/${dirName}/base.json`;
			const meta = { Paket: 'Basis', ...((bases[basePath] as any)?._meta ?? {}) };
			const sliceGating = gating.slices?.[dirName];
			const sliceLevelGate =
				sliceGating?.plan || sliceGating?.feature
					? { plan: sliceGating?.plan, feature: sliceGating?.feature }
					: null;

			const variations = (model.variations ?? [])
				.filter((v: any) => !SKIP.has(`${model.id}/${v.id}`))
				.map((v: any) => {
					const varGate = sliceGating?.variations?.[v.id];
					const requiredPlan = resolveRequiredPlan(varGate) ?? resolveRequiredPlan(sliceLevelGate);
					return { id: v.id as string, name: v.name as string, requiredPlan };
				});

			return {
				id: model.id as string,
				name: model.name as string,
				dirName,
				variations,
				meta
			};
		})
		.filter((s) => s.id && s.dirName && s.variations.length > 0)
		.sort((a, b) => a.name.localeCompare(b.name, 'de'));

	// landing_page: true → Root-Layout blendet Header und Footer aus
	return { katalogSlices, plans, page: { data: { landing_page: true } } };
};
