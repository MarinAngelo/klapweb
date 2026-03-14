// Loads all slice models for the sidebar navigation — available to all /katalog/* routes.
export const prerender = false;

const models = import.meta.glob('/src/lib/slices/*/model.json', { eager: true });

const SKIP = new Set(['form/kauf', 'image_cards/plaene']);

export const load = async () => {
	const katalogSlices = Object.entries(models)
		.map(([path, model]: [string, any]) => {
			const dirName = path.match(/\/slices\/([^/]+)\/model\.json/)?.[1] ?? '';
			const variations = (model.variations ?? [])
				.filter((v: any) => !SKIP.has(`${model.id}/${v.id}`))
				.map((v: any) => ({ id: v.id as string, name: v.name as string }));
			return { id: model.id as string, name: model.name as string, dirName, variations };
		})
		.filter((s) => s.id && s.dirName && s.variations.length > 0)
		.sort((a, b) => a.name.localeCompare(b.name, 'de'));

	// landing_page: true → Root-Layout blendet Header und Footer aus
	return { katalogSlices, page: { data: { landing_page: true } } };
};
