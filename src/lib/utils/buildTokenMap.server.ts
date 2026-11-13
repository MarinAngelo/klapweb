import { websiteVariables } from '$lib/variables.js';

/**
 * Token maps from the "Variablen" Prismic document in the page language (see $lib/variables.js):
 * plain = {{Token}} → text, rich = {{Token}} alone in a paragraph → paragraphs
 */
export function buildTokenMap(vData: Parameters<typeof websiteVariables>[0], lang = '') {
	return websiteVariables(vData, lang);
}
