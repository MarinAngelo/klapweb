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
const AUTH_COOKIE = 'agency_auth';

function read(path: string) {
	return JSON.parse(readFileSync(path, 'utf-8'));
}

function write(path: string, data: unknown) {
	writeFileSync(path, JSON.stringify(data, null, '\t') + '\n');
}

function isAuthenticated(cookies: Record<string, string>): boolean {
	const cookie = cookies[AUTH_COOKIE];
	if (!cookie) return false;
	try {
		const parsed = JSON.parse(Buffer.from(cookie, 'base64').toString());
		// Prüfe ob Cookie nicht älter als 1 Stunde
		return parsed.exp > Date.now();
	} catch {
		return false;
	}
}

export const load = ({ cookies }) => {
	// Prüfe Authentication direkt
	const cookie = cookies.get(AUTH_COOKIE);
	let authenticated = false;

	if (cookie) {
		try {
			const parsed = JSON.parse(Buffer.from(cookie, 'base64').toString());
			authenticated = parsed.exp > Date.now();
		} catch {
			authenticated = false;
		}
	}

	if (!authenticated) {
		return { authenticated: false };
	}

	// Nur wenn authentifiziert: Daten laden
	const gating = read(GATING_PATH);
	const smConfig = read(SM_CONFIG_PATH);
	const overrides = existsSync(OVERRIDES_PATH) ? read(OVERRIDES_PATH) : { features: [] };

	const currentPlan = smConfig.plan || 'basis';
	const activePlanChain = getActivePlanChain(currentPlan, gating.plans);
	const basePlanFeatures = getActiveFeatures(activePlanChain, gating.features);

	// Appliziere Overrides: entferne disabled, addiere enabled
	const enabledFeatures = (overrides.enabled ?? []).filter((f: string) => gating.features?.[f]);
	const disabledFeatures = (overrides.disabled ?? []);
	const activeFeatures = [...new Set([...basePlanFeatures.filter(f => !disabledFeatures.includes(f)), ...enabledFeatures])];

	return {
		authenticated: true,
		plans: gating.plans,
		features: gating.features,
		currentPlan,
		basePlanFeatures, // Base-Plan-Features (ohne Overrides)
		activeFeatures, // Finale Features (mit Overrides)
		overrideFeatures: enabledFeatures
	};
};

export const actions = {
	async login({ request, cookies }) {
		const data = await request.formData();
		const secret = data.get('secret') as string;

		const expectedSecret = env.AGENCY_SECRET;
		if (!expectedSecret || secret !== expectedSecret) {
			return { error: 'Falsches Passwort' };
		}

		// Setze Auth-Cookie (gültig für 1 Stunde)
		const exp = Date.now() + 60 * 60 * 1000;
		const cookieValue = Buffer.from(JSON.stringify({ exp })).toString('base64');
		cookies.set(AUTH_COOKIE, cookieValue, {
			httpOnly: true,
			secure: false, // Lokal http://localhost erlauben
			sameSite: 'strict',
			maxAge: 60 * 60 * 1000, // 1 Stunde
			path: '/'
		});

		throw redirect(303, '/agency/gating');
	},

	async logout({ cookies }) {
		cookies.delete(AUTH_COOKIE, { path: '/' });
		throw redirect(303, '/agency/gating');
	},

	async save({ request, cookies }) {
		// Prüfe Authentication direkt
		const cookie = cookies.get(AUTH_COOKIE);
		let authenticated = false;
		if (cookie) {
			try {
				const parsed = JSON.parse(Buffer.from(cookie, 'base64').toString());
				authenticated = parsed.exp > Date.now();
			} catch {
				authenticated = false;
			}
		}
		if (!authenticated) throw error(403, 'Nicht authentifiziert');

		const data = await request.formData();
		const plan = data.get('plan') as string;
		const selectedOverrides = JSON.parse(data.get('overrides') as string);

		// Load gating.json
		const gating = read(GATING_PATH);

		// 1. Update plan in slicemachine.config.json
		const smConfig = read(SM_CONFIG_PATH);
		smConfig.plan = plan;
		write(SM_CONFIG_PATH, smConfig);

		// 2. Write gating.overrides.json mit enabled + disabled
		const planChain = getActivePlanChain(plan, gating.plans);
		const planFeatures = getActiveFeatures(planChain, gating.features);
		const enabled = selectedOverrides.filter((f: string) => !planFeatures.includes(f));
		const disabled = planFeatures.filter((f: string) => !selectedOverrides.includes(f));

		write(OVERRIDES_PATH, {
			enabled: enabled,
			disabled: disabled
		});

		// 3. Run build-customtypes.js
		try {
			execSync('node scripts/build-customtypes.js', { stdio: 'inherit', cwd: ROOT });
		} catch (e) {
			console.error('build-customtypes.js failed:', e);
			throw error(500, 'Fehler beim Generieren der Modelle');
		}

		throw redirect(303, '/agency/gating');
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
