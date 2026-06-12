import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

export const prerender = false;

const ROOT = process.cwd();
const GATING_PATH = join(ROOT, 'gating.json');
const SM_CONFIG_PATH = join(ROOT, 'slicemachine.config.json');
const OVERRIDES_PATH = join(ROOT, 'gating.overrides.json');

function checkAuth(url: URL) {
	const secret = env.AGENCY_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
}

function read(path: string) {
	return JSON.parse(readFileSync(path, 'utf-8'));
}

function write(path: string, data: unknown) {
	writeFileSync(path, JSON.stringify(data, null, '\t') + '\n');
}

export const load = ({ url }) => {
	checkAuth(url);

	const gating = read(GATING_PATH);
	const smConfig = read(SM_CONFIG_PATH);
	const overrides = existsSync(OVERRIDES_PATH) ? read(OVERRIDES_PATH) : { features: [] };

	const currentPlan = smConfig.plan || 'basis';
	const activePlanChain = getActivePlanChain(currentPlan, gating.plans);
	const activeFeatures = getActiveFeatures(activePlanChain, gating.features);
	const overrideFeatures = (overrides.features ?? []).filter((f: string) => gating.features?.[f]);

	return {
		plans: gating.plans,
		features: gating.features,
		currentPlan,
		activeFeatures,
		overrideFeatures,
		secret: url.searchParams.get('secret')
	};
};

export const actions = {
	async save({ request, url }) {
		checkAuth(url);

		const data = await request.formData();
		const plan = data.get('plan') as string;
		const selectedOverrides = JSON.parse(data.get('overrides') as string);

		// 1. Update plan in slicemachine.config.json
		const smConfig = read(SM_CONFIG_PATH);
		smConfig.plan = plan;
		write(SM_CONFIG_PATH, smConfig);

		// 2. Write gating.overrides.json
		write(OVERRIDES_PATH, { features: selectedOverrides });

		// 3. Run build-customtypes.js
		try {
			execSync('node scripts/build-customtypes.js', { stdio: 'inherit', cwd: ROOT });
		} catch (e) {
			console.error('build-customtypes.js failed:', e);
			throw error(500, 'Fehler beim Generieren der Modelle');
		}

		const secret = url.searchParams.get('secret');
		throw redirect(303, `/agency/gating?secret=${secret}`);
	}
};

function getActivePlanChain(planKey: string, plans: Record<string, { extends?: string }>): string[] {
	if (!planKey || !plans[planKey]) return planKey ? [planKey] : [];
	const parent = plans[planKey]?.extends;
	return [planKey, ...(parent ? getActivePlanChain(parent, plans) : [])];
}

function getActiveFeatures(
	planChain: string[],
	features: Record<string, { plans?: string[] }>
): string[] {
	return Object.entries(features ?? {})
		.filter(([, def]) => (def.plans ?? []).some((p) => planChain.includes(p)))
		.map(([id]) => id);
}
