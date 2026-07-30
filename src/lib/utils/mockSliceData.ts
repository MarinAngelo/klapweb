// Generates mock Prismic slice data from a model.json variation definition.
import { t } from '$lib/i18n/translations';

const LOREM =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const LOREM2 =
	'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

function mockImage(key: string, index: number, config: any, lang: string): any {
	const seed = `${key}${index}`;
	const w = Math.min(config?.constraint?.width || 800, 1200);
	const h = Math.min(config?.constraint?.height || 600, 900);
	const img: Record<string, any> = {
		dimensions: { width: w, height: h },
		alt: t('Platzhalterbild', lang),
		copyright: null,
		url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
		edit: { x: 0, y: 0, zoom: 1, background: 'transparent' }
	};
	for (const thumb of config?.thumbnails ?? []) {
		img[thumb.name] = {
			dimensions: { width: thumb.width, height: thumb.height },
			alt: t('Platzhalterbild', lang),
			copyright: null,
			url: `https://picsum.photos/seed/${seed}_${thumb.name}/${thumb.width}/${thumb.height}`,
			edit: { x: 0, y: 0, zoom: 1, background: 'transparent' }
		};
	}
	return img;
}

function mockGroupItems(
	fields: Record<string, any>,
	count: number,
	lang: string,
	sliceName: string
): any[] {
	return Array.from({ length: count }, (_, i) => {
		const item: Record<string, any> = {};
		for (const [k, fd] of Object.entries(fields)) {
			item[k] = mockField(k, fd as any, lang, i, sliceName);
		}
		return item;
	});
}

function mockField(key: string, fieldDef: any, lang: string, index = 0, sliceName = ''): any {
	const { type, config } = fieldDef ?? {};
	const lk = (key ?? '').toLowerCase();
	const exampleHeading = sliceName
		? `${t('Beispiel', lang)}-${t(sliceName, lang)}-${t('Überschrift', lang)}`
		: t('Beispiel-Überschrift', lang);

	switch (type) {
		case 'Text': {
			if (lk.includes('titel') || lk.includes('title') || lk.includes('heading'))
				return exampleHeading;
			if (lk.includes('name') && !lk.includes('field')) return t('Max Mustermann', lang);
			if (lk === 'map_url')
				return 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2702.4!2d8.5417!3d47.3769!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47900b9749bea219%3A0xe66e8df1e71fdc03!2sZ%C3%BCrich!5e0!3m2!1sde!2sch!4v1234567890';
			if (lk.includes('url') || lk === 'link') return '#';
			if (lk.includes('label')) return t('Beispiel-Label', lang);
			if (lk.includes('preis') || lk.includes('price')) return "1'200";
			if (lk.includes('button') || lk.includes('cta')) return t('Mehr erfahren', lang);
			if (lk.includes('placeholder')) return '';
			return t('Beispieltext', lang);
		}

		case 'StructuredText': {
			// Slice-spezifische Mock-Texte
			if (sliceName === 'AdresseUndMap' && key === 'text') {
				return [
					{ type: 'heading3', text: t('Beispiel Firma GmbH', lang), spans: [] },
					{ type: 'paragraph', text: 'Musterstrasse 12', spans: [] },
					{ type: 'paragraph', text: '8001 Zürich', spans: [] },
					{ type: 'paragraph', text: '+41 44 123 45 67', spans: [] },
					{ type: 'paragraph', text: 'info@beispiel.ch', spans: [] }
				];
			}
			const placeholder = config?.placeholder || '';
			const singleMatch = (config?.single ?? '').match(/heading(\d)/);
			if (singleMatch) {
				return [
					{
						type: `heading${singleMatch[1]}`,
						text: placeholder || exampleHeading,
						spans: []
					}
				];
			}
			const multiFirst = (config?.multi ?? '').split(',')[0];
			if (multiFirst.startsWith('heading')) {
				const tag = multiFirst.replace('-', '');
				return [
					{ type: tag, text: placeholder || exampleHeading, spans: [] },
					...(placeholder
						? []
						: [
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
			if (lk.includes('percent') || lk.includes('prozent') || lk.includes('discount')) return 10;
			if (lk.includes('delay')) return 0;
			if (lk.includes('duration') || lk.includes('dauer')) return 500;
			if (lk.includes('opacity') || lk.includes('transparenz')) return 30;
			return 0;
		}

		case 'Color':
			return null;

		case 'Image':
			return mockImage(key, index, config, lang);

		case 'Link':
			return { link_type: 'Web', url: '#', target: null };

		case 'ContentRelationship':
			return { link_type: 'Any' };

		case 'GeoPoint':
			return { latitude: 47.3769, longitude: 8.5417 };

		case 'Group': {
			const items = mockGroupItems(config?.fields ?? {}, 3, lang, sliceName);
			return items.map((item, i) => ({
				...item,
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

export function generateMockSlice(
	sliceType: string,
	variation: any,
	lang = 'de-ch',
	sliceName = '',
	mockImages: Record<string, string> = {}
): MockSlice {
	const primary: Record<string, any> = {};
	for (const [key, fieldDef] of Object.entries(variation.primary ?? {})) {
		if ((fieldDef as any).type === 'Image' && mockImages[key]) {
			const cfg = (fieldDef as any).config ?? {};
			const w = Math.min(cfg.constraint?.width || 800, 1200);
			const h = Math.min(cfg.constraint?.height || 600, 900);
			primary[key] = {
				url: mockImages[key],
				dimensions: { width: w, height: h },
				alt: null,
				copyright: null,
				edit: { x: 0, y: 0, zoom: 1, background: 'transparent' }
			};
		} else {
			primary[key] = mockField(key, fieldDef as any, lang, 0, sliceName);
		}
	}

	const items: any[] = [];
	const itemFields = variation.items ?? {};
	if (Object.keys(itemFields).length > 0) {
		for (let i = 0; i < 3; i++) {
			const item: Record<string, any> = {};
			for (const [key, fieldDef] of Object.entries(itemFields)) {
				item[key] = mockField(key, fieldDef as any, lang, i, sliceName);
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
