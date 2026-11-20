import { legalPageKey } from '$lib/i18n/i18n';
import type { ParamMatcher } from '@sveltejs/kit';

// Slugs of the legal pages in all languages (staticRoutes), e.g. impressum, legal-notice
export const match: ParamMatcher = (param) => legalPageKey(param) !== null;
