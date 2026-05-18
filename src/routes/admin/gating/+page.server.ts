export const prerender = false;

import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { env } from '$env/dynamic/private';

const GATING_PATH = 'gating.json';
const SM_CONFIG_PATH = 'slicemachine.config.json';
const SLICES_DIR = 'src/lib/slices';

function checkAuth(url: URL) {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
}

export const load: PageServerLoad = async ({ url }) => {
	checkAuth(url);

	const gating = JSON.parse(readFileSync(GATING_PATH, 'utf-8'));

	const sliceNames = readdirSync(SLICES_DIR).filter((name) => {
		try {
			return statSync(`${SLICES_DIR}/${name}`).isDirectory();
		} catch {
			return false;
		}
	});

	let activePlan = 'unbekannt';
	try {
		const smConfig = JSON.parse(readFileSync(SM_CONFIG_PATH, 'utf-8'));
		activePlan = smConfig.plan ?? 'unbekannt';
	} catch {
		// ignore
	}

	return { gating, sliceNames, activePlan };
};

export const actions: Actions = {
	save: async ({ request, url }) => {
		checkAuth(url);
		const formData = await request.formData();
		const raw = formData.get('gating') as string;

		let parsed: { plans: unknown; features: unknown; slices: unknown };
		try {
			parsed = JSON.parse(raw);
		} catch {
			throw error(400, 'Ungültiges JSON');
		}

		const existing = JSON.parse(readFileSync(GATING_PATH, 'utf-8'));
		const updated = {
			...existing,
			plans: parsed.plans,
			features: parsed.features,
			slices: parsed.slices
		};

		writeFileSync(GATING_PATH, JSON.stringify(updated, null, '\t'));
		return { success: true };
	}
};
