/**
 * Guide chapters from the code (src/lib/anleitung) for the Inhalts-Element «Anleitung».
 * Server only: the texts reach the browser as page data of the page that shows them,
 * never as part of the JavaScript bundle of every website.
 */
import index from '$lib/anleitung/index.json';
import { ALL_CHAPTERS } from '$lib/anleitung/options.js';
import gating from '../../../gating.json';
import fieldReference from '$lib/generated/prismic-field-reference.json';
import { fieldDescriptions } from '$lib/fieldDescriptions';
import { expandFieldRefs, fieldLookup } from '$lib/anleitung/fields.js';

const files = import.meta.glob('../anleitung/kapitel/*.html', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

export type GuideChapter = {
	id: string;
	title: string;
	/** Label of the feature in gating.json (plan filter), null = for every package */
	featureLabel: string | null;
	html: string;
};

const featureLabels = gating.features as Record<string, { label: string }>;
// Field references (data-field) → current label + agency description of the field
const lookup = fieldLookup(
	fieldReference as { customType: string; field: string; label: string }[],
	fieldDescriptions
);

const chapters: GuideChapter[] = (index as { id: string; title: string; feature?: string }[]).map(
	(c) => ({
		id: c.id,
		title: c.title,
		featureLabel: (c.feature && featureLabels[c.feature]?.label) || null,
		html: expandFieldRefs(files[`../anleitung/kapitel/${c.id}.html`] ?? '', lookup).html
	})
);

/**
 * Chapters per «Anleitung» slice (key = slice id), for the SliceZone context.
 * A slice shows the chapter chosen in «Kapitel aus der Anleitung»; «Alle übrigen Kapitel»
 * shows every chapter that no other slice of the page has chosen.
 */
export function guideChaptersFor(slices: unknown): Record<string, GuideChapter[]> {
	const guides = (Array.isArray(slices) ? slices : []).filter(
		(s) => s?.slice_type === 'anleitung' && s.primary?.chapter
	);
	if (guides.length === 0) return {};

	const placed = new Set<string>(guides.map((s) => s.primary.chapter));
	return Object.fromEntries(
		guides.map((s) => [
			s.id,
			s.primary.chapter === ALL_CHAPTERS
				? chapters.filter((c) => !placed.has(c.title))
				: chapters.filter((c) => c.title === s.primary.chapter)
		])
	);
}
