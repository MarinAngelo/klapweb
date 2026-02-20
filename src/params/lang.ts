import { isLanguage } from '$lib/i18n/i18n';
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
	return isLanguage(param);
};
