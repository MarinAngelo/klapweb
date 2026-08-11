import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const prerender = false;

const OVERRIDES_PATH = join(process.cwd(), 'gating.overrides.json');

export const load: PageServerLoad = async ({ url }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) {
		throw redirect(303, '/admin');
	}

	let disabledSections: string[] = [];
	if (existsSync(OVERRIDES_PATH)) {
		try {
			const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8'));
			disabledSections = overrides.admin_sections_disabled ?? [];
		} catch {
			// Overrides nicht lesbar → alle Sections anzeigen
		}
	}

	return { secret: provided, disabledSections };
};
