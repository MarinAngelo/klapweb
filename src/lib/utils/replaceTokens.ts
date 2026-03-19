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
			text: block.text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`)
		};
	});
}
