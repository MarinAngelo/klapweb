import type { PageServerLoad } from './$types';
import { CONFIG_OVERRIDES, getGatedAdminSections } from '$lib/server/features';

export const prerender = false;

export const load: PageServerLoad = async () => {
	// Agency switches of this branch (slicemachine.config.json, build-time)
	const overrides = CONFIG_OVERRIDES;

	// Hidden: manually disabled in agency panel + plan/feature gate in gating.json inactive
	const disabledSections = [
		...new Set([...(overrides.admin_sections_disabled ?? []), ...getGatedAdminSections(overrides)])
	];

	return { disabledSections };
};
