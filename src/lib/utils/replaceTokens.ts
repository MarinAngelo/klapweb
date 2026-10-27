type RichTextBlock = {
	type: string;
	text: string;
	spans: unknown[];
	[key: string]: unknown;
};

import { tokenKey } from '$lib/variables.js';

const TOKEN = /\{\{([^{}]+)\}\}/g;
const ALONE = /^\s*\{\{([^{}]+)\}\}\s*$/;

/**
 * Replaces {{TOKEN}} placeholders in all text nodes of a Prismic RichText field.
 * A token alone in a paragraph with a multi-line value (rich) is replaced by its paragraphs.
 * Tokens not found in the maps are left as-is ({{TOKEN}}).
 */
export function replaceTokens(
	field: RichTextBlock[] | null | undefined,
	vars: Record<string, string>,
	rich: Record<string, RichTextBlock[]> = {}
): RichTextBlock[] | null | undefined {
	if (!field || (Object.keys(vars).length === 0 && Object.keys(rich).length === 0)) return field;

	return field.flatMap((block) => {
		if (!block.text) return [block];
		const alone = block.type === 'paragraph' ? block.text.match(ALONE) : null;
		if (alone && rich[tokenKey(alone[1])]) return rich[tokenKey(alone[1])];
		return [
			{
				...block,
				// Any name without braces — \w would miss umlauts ({{Buchungseinschränkung}})
				text: block.text.replace(TOKEN, (match, key: string) => vars[tokenKey(key)] ?? match)
			}
		];
	});
}
