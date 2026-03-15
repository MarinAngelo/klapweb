// Generates mock Prismic slice data from a model.json variation definition.

const LOREM =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const LOREM2 =
	'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

function mockImage(key: string, index: number, config: any): any {
	const seed = `${key}${index}`;
	const w = Math.min(config?.constraint?.width || 800, 1200);
	const h = Math.min(config?.constraint?.height || 600, 900);
	const img: Record<string, any> = {
		dimensions: { width: w, height: h },
		alt: 'Platzhalterbild',
		copyright: null,
		url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
		edit: { x: 0, y: 0, zoom: 1, background: 'transparent' }
	};
	for (const thumb of config?.thumbnails ?? []) {
		img[thumb.name] = {
			dimensions: { width: thumb.width, height: thumb.height },
			alt: 'Platzhalterbild',
			copyright: null,
			url: `https://picsum.photos/seed/${seed}_${thumb.name}/${thumb.width}/${thumb.height}`,
			edit: { x: 0, y: 0, zoom: 1, background: 'transparent' }
		};
	}
	return img;
}

function mockGroupItems(fields: Record<string, any>, count: number): any[] {
	return Array.from({ length: count }, (_, i) => {
		const item: Record<string, any> = {};
		for (const [k, fd] of Object.entries(fields)) {
			item[k] = mockField(k, fd as any, i);
		}
		return item;
	});
}

function mockField(key: string, fieldDef: any, index = 0): any {
	const { type, config } = fieldDef ?? {};
	const lk = (key ?? '').toLowerCase();

	switch (type) {
		case 'Text': {
			if (lk.includes('titel') || lk.includes('title') || lk.includes('heading'))
				return 'Beispiel-Überschrift';
			if (lk.includes('name') && !lk.includes('field')) return 'Max Mustermann';
			if (lk.includes('url') || lk === 'link') return '#';
			if (lk.includes('label')) return 'Beispiel-Label';
			if (lk.includes('preis') || lk.includes('price')) return "1'200";
			if (lk.includes('button') || lk.includes('cta')) return 'Mehr erfahren';
			if (lk.includes('placeholder')) return '';
			return 'Beispieltext';
		}

		case 'StructuredText': {
			const placeholder = config?.placeholder || '';
			const singleMatch = (config?.single ?? '').match(/heading(\d)/);
			if (singleMatch) {
				return [{ type: `heading${singleMatch[1]}`, text: placeholder || 'Beispiel-Überschrift', spans: [] }];
			}
			const multiFirst = (config?.multi ?? '').split(',')[0];
			if (multiFirst.startsWith('heading')) {
				const tag = multiFirst.replace('-', '');
				return [
					{ type: tag, text: placeholder || 'Beispiel-Überschrift', spans: [] },
					...(placeholder ? [] : [
						{ type: 'paragraph' as const, text: LOREM, spans: [] },
						{ type: 'paragraph' as const, text: LOREM2, spans: [] }
					])
				];
			}
			return [{ type: 'paragraph', text: placeholder || LOREM, spans: [] }];
		}

		case 'Boolean':
			return config?.default_value ?? false;

		case 'Select':
			return config?.default_value || config?.options?.[0] || null;

		case 'Number': {
			if (lk.includes('preis') || lk.includes('price')) return 1200;
			if (lk.includes('percent') || lk.includes('prozent') || lk.includes('discount'))
				return 10;
			if (lk.includes('delay')) return 0;
			if (lk.includes('duration') || lk.includes('dauer')) return 500;
			if (lk.includes('opacity') || lk.includes('transparenz')) return 30;
			return 0;
		}

		case 'Color':
			return null;

		case 'Image':
			return mockImage(key, index, config);

		case 'Link':
			return { link_type: 'Web', url: '#', target: null };

		case 'ContentRelationship':
			return { link_type: 'Any' };

		case 'GeoPoint':
			return { latitude: 47.3769, longitude: 8.5417 };

		case 'Group': {
			const items = mockGroupItems(config?.fields ?? {}, 3);
			// Vary last item for visual variety
			return items.map((item, i) => ({
				...item,
				// Override text fields to have different content
				...Object.fromEntries(
					Object.entries(item).map(([k, v]) => {
						if (typeof v === 'string' && v.length > 0 && !v.startsWith('#')) {
							return [k, v + (i > 0 ? ` ${i + 1}` : '')];
						}
						return [k, v];
					})
				)
			}));
		}

		default:
			return null;
	}
}

export interface MockSlice {
	slice_type: string;
	variation: string;
	slice_label: null;
	primary: Record<string, any>;
	items: any[];
	id: string;
}

export function generateMockSlice(sliceType: string, variation: any): MockSlice {
	const primary: Record<string, any> = {};
	for (const [key, fieldDef] of Object.entries(variation.primary ?? {})) {
		primary[key] = mockField(key, fieldDef as any);
	}

	const items: any[] = [];
	const itemFields = variation.items ?? {};
	if (Object.keys(itemFields).length > 0) {
		for (let i = 0; i < 3; i++) {
			const item: Record<string, any> = {};
			for (const [key, fieldDef] of Object.entries(itemFields)) {
				item[key] = mockField(key, fieldDef as any, i);
			}
			items.push(item);
		}
	}

	return {
		slice_type: sliceType,
		variation: variation.id,
		slice_label: null,
		primary,
		items,
		id: `mock_${sliceType}_${variation.id}`
	};
}
