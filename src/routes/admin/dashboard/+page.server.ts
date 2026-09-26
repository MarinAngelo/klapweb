import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getGatedAdminSections } from '$lib/server/features';

export const prerender = false;

const OVERRIDES_PATH = join(process.cwd(), 'gating.overrides.json');

export const load: PageServerLoad = async ({ url }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) {
		throw redirect(303, provided ? '/admin?error=1' : '/admin');
	}

	let overrides: { enabled?: string[]; disabled?: string[]; admin_sections_disabled?: string[] } =
		{};
	if (existsSync(OVERRIDES_PATH)) {
		try {
			overrides = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8'));
		} catch {
			// Overrides nicht lesbar → nur Plan-/Feature-Gates aus gating.json
		}
	}

	// Hidden: manually disabled in agency panel + plan/feature gate in gating.json inactive
	const disabledSections = [
		...new Set([...(overrides.admin_sections_disabled ?? []), ...getGatedAdminSections(overrides)])
	];

	return { secret: provided, disabledSections };
};
