type RichTextBlock = {
	type: string;
	text: string;
	spans: unknown[];
	[key: string]: unknown;
};

/**
 * Replaces {{TOKEN}} placeholders in all text nodes of a Prismic RichText field.
 * Tokens not found in the map are left as-is ({{TOKEN}}).
 */
export function replaceTokens(
	field: RichTextBlock[] | null | undefined,
	vars: Record<string, string>
): RichTextBlock[] | null | undefined {
	if (!field || Object.keys(vars).length === 0) return field;

	return field.map((block) => {
		if (!block.text) return block;
		return {
			...block,
			// Any name without braces — \w would miss umlauts ({{Buchungseinschränkung}})
			text: block.text.replace(
				/\{\{([^{}]+)\}\}/g,
				(match, key: string) => vars[key.trim()] ?? match
			)
		};
	});
}
