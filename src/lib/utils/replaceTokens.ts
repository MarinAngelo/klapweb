import { expandTokensInField } from '$lib/variables.js';

type RichTextBlock = {
	type: string;
	text: string;
	spans: unknown[];
	[key: string]: unknown;
};

/**
 * Replaces {{TOKEN}} placeholders in a Prismic RichText field (see expandTokensInField):
 * a token alone in a paragraph with a multi-line value is replaced by its paragraphs,
 * formatting spans stay aligned. Tokens not found in the maps are left as-is.
 */
export function replaceTokens(
	field: RichTextBlock[] | null | undefined,
	vars: Record<string, string>,
	rich: Record<string, RichTextBlock[]> = {}
): RichTextBlock[] | null | undefined {
	if (!field || (Object.keys(vars).length === 0 && Object.keys(rich).length === 0)) return field;
	return expandTokensInField(field, vars, rich);
}
