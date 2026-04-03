import { error } from '@sveltejs/kit';
import { generateMockSlice } from '$lib/utils/mockSliceData';

export const prerender = false;

const models = import.meta.glob('/src/lib/slices/*/model.json', { eager: true });
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

export const load = async ({ params, parent }) => {
	const { lang } = await parent();
	const isEn = (lang as string).startsWith('en');

	const entry = Object.entries(models).find(([path]) =>
		path.includes(`/${params.slice}/model.json`)
	);
	if (!entry) throw error(404, `Slice "${params.slice}" nicht gefunden`);

	const model = entry[1] as any;
	const variation = (model.variations ?? []).find((v: any) => v.id === params.variation);
	if (!variation) throw error(404, `Variation "${params.variation}" nicht gefunden`);

	const sliceGating = gating.slices?.[params.slice];
	const varGate = sliceGating?.variations?.[params.variation];
	const sliceLevelGate =
		sliceGating?.plan || sliceGating?.feature
			? { plan: sliceGating.plan, feature: sliceGating.feature }
			: null;
	const gateLabel = resolveGateLabel(varGate) ?? resolveGateLabel(sliceLevelGate);

	// catalog-Metadaten aus gating.json (einzige Quelle für Katalog-Konfiguration)
	const sliceCatalog = sliceGating?.catalog ?? {};
	const varCatalog = sliceGating?.variations?.[params.variation]?.catalog ?? {};
	const mockImages: Record<string, string> = varCatalog.mockImages ?? {};

	const beschreibungKey = isEn ? 'BeschreibungEn' : 'Beschreibung';
	const sliceBeschreibung = (sliceCatalog[beschreibungKey] ?? sliceCatalog['Beschreibung']) as
		| string
		| undefined;
	const varBeschreibung = (varCatalog[beschreibungKey] ?? varCatalog['Beschreibung']) as
		| string
		| undefined;
	const beschreibung =
		[sliceBeschreibung, varBeschreibung].filter(Boolean).join(' — ') || undefined;

	const meta = {
		Paket: 'Basis',
		...(gateLabel ? { Paket: gateLabel } : {}),
		...(beschreibung ? { Beschreibung: beschreibung } : {})
	};

	const FUNCTIONAL_TYPES = new Set(['Boolean', 'Select', 'Number', 'Image']);
	const functionalFields = Object.entries(variation.primary ?? {})
		.filter(([, field]) => FUNCTIONAL_TYPES.has((field as any).type))
		.map(([key, field]: [string, any]) => ({
			key,
			type: field.type as string,
			label: field.config?.label ?? key,
			options: (field.config?.options ?? null) as string[] | null,
			default_value: field.config?.default_value ?? null,
			placeholder_false: field.config?.placeholder_false ?? 'Nein',
			placeholder_true: field.config?.placeholder_true ?? 'Ja',
			placeholder: field.config?.placeholder ?? '',
			default_url: mockImages[key] ?? null
		}));

	return {
		sliceId: model.id as string,
		sliceName: model.name as string,
		variationId: variation.id as string,
		variationName: variation.name as string,
		mockSlice: generateMockSlice(
			model.id,
			variation,
			lang as string,
			model.name as string,
			mockImages
		),
		meta,
		functionalFields
	};
};
