import type { PageServerLoad } from './$types';
import { getGatedAdminSections } from '$lib/server/features';
import { readOverrides } from '$lib/gatingOverrides.js';

export const prerender = false;

export const load: PageServerLoad = async () => {
	// Local agency switches of this repository (missing/unreadable → only gating.json gates)
	const overrides = readOverrides();

	// Hidden: manually disabled in agency panel + plan/feature gate in gating.json inactive
	const disabledSections = [
		...new Set([...(overrides.admin_sections_disabled ?? []), ...getGatedAdminSections(overrides)])
	];

	return { disabledSections };
};
