import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { createHmac, timingSafeEqual } from 'crypto';
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

const AUTH_MAX_AGE_SECONDS = 60 * 60;

// Cookie format: "<exp>.<hmac-sha256(exp, AGENCY_SECRET)>" — unforgeable without the secret
function sign(value: string, secret: string): string {
	return createHmac('sha256', secret).update(value).digest('base64url');
}

function createAuthCookie(secret: string): string {
	const exp = String(Date.now() + AUTH_MAX_AGE_SECONDS * 1000);
	return `${exp}.${sign(exp, secret)}`;
}

function isAuthenticated(cookie: string | undefined): boolean {
	const secret = env.AGENCY_SECRET;
	if (!cookie || !secret) return false;
	const [exp, signature] = cookie.split('.');
	if (!exp || !signature) return false;
	const expected = Buffer.from(sign(exp, secret));
	const actual = Buffer.from(signature);
	if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
	return Number(exp) > Date.now();
}

export const load = ({ cookies }) => {
	if (!isAuthenticated(cookies.get(AUTH_COOKIE))) {
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
	const disabledFeatures = overrides.disabled ?? [];
	const activeFeatures = [
		...new Set([
			...basePlanFeatures.filter((f) => !disabledFeatures.includes(f)),
			...enabledFeatures
		])
	];

	const adminSections = gating.admin_sections ?? {};
	const adminSectionsDisabled: string[] = overrides.admin_sections_disabled ?? [];

	// Prüfe ob für aktive Features benötigte Env-Vars gesetzt sind
	const missingEnv = activeFeatures
		.map((featureId) => {
			const def = gating.features?.[featureId];
			const required: string[] = def?.env ?? [];
			const missing = required.filter((name) => !env[name]);
			return { featureId, label: def?.label ?? featureId, missing };
		})
		.filter((entry) => entry.missing.length > 0);

	return {
		authenticated: true,
		plans: gating.plans,
		features: gating.features,
		currentPlan,
		basePlanFeatures,
		activeFeatures,
		overrideFeatures: enabledFeatures,
		adminSections,
		adminSectionsDisabled,
		missingEnv,
		// gating.json is committed → only editable on the local dev server
		canEditDefinition: dev,
		gatingItems: collectGatingItems(gating)
	};
};

type Gate = { feature?: string; plan?: string };
type GatingItem = {
	kind:
		| 'customType'
		| 'customTypeField'
		| 'slice'
		| 'variation'
		| 'field'
		| 'overlay'
		| 'adminSection';
	target: string;
	detail?: string;
	gate: Gate;
};

// Flattens gating.json (+ implicit tab overlays in customtypes/_features) into a list for the overview
function collectGatingItems(gating: any): GatingItem[] {
	const items: GatingItem[] = [];
	const gateOf = (def: any): Gate | null =>
		def?.feature ? { feature: def.feature } : def?.plan ? { plan: def.plan } : null;

	for (const [typeId, def] of Object.entries<any>(gating.customTypes ?? {})) {
		const gate = gateOf(def);
		if (gate) items.push({ kind: 'customType', target: typeId, gate });
		for (const [field, fieldDef] of Object.entries<any>(def.fields ?? {})) {
			const fieldGate = gateOf(fieldDef);
			if (fieldGate)
				items.push({ kind: 'customTypeField', target: typeId, detail: field, gate: fieldGate });
		}
	}

	for (const [sliceName, def] of Object.entries<any>(gating.slices ?? {})) {
		const gate = gateOf(def);
		if (gate) items.push({ kind: 'slice', target: sliceName, gate });
		for (const [variation, varDef] of Object.entries<any>(def.variations ?? {})) {
			const varGate = gateOf(varDef);
			if (varGate)
				items.push({ kind: 'variation', target: sliceName, detail: variation, gate: varGate });
		}
		for (const [field, fieldDef] of Object.entries<any>(def.fields ?? {})) {
			const fieldGate = gateOf(fieldDef);
			if (fieldGate)
				items.push({ kind: 'field', target: sliceName, detail: field, gate: fieldGate });
		}
	}

	for (const [sectionId, def] of Object.entries<any>(gating.admin_sections ?? {})) {
		const target = def.label ?? sectionId;
		const gate = gateOf(def);
		if (gate) items.push({ kind: 'adminSection', target, gate });
		// OR gate: listed under each feature, marked as alternative
		const alternatives: string[] = def.features ?? [];
		for (const feature of alternatives) {
			const others = alternatives.filter((f) => f !== feature);
			items.push({
				kind: 'adminSection',
				target,
				detail: others.length ? `oder ${others.join(', ')}` : undefined,
				gate: { feature }
			});
		}
	}

	// Tab overlays: customtypes/_features/{feature}/{page|settings}.json — active with the feature
	const featuresDir = join(ROOT, 'customtypes/_features');
	if (existsSync(featuresDir)) {
		for (const feature of readdirSync(featuresDir)) {
			for (const type of ['page', 'settings']) {
				const overlayPath = join(featuresDir, feature, `${type}.json`);
				if (!existsSync(overlayPath)) continue;
				const overlay = read(overlayPath);
				const tabs = Object.keys(overlay).filter((key) => key !== '_meta');
				const sliceChoices: string[] = overlay._meta?.sliceChoices ?? [];
				const parts = [
					...tabs.map((tab) => `Tab ${tab}`),
					...(sliceChoices.length ? [`Slices: ${sliceChoices.join(', ')}`] : [])
				];
				items.push({
					kind: 'overlay',
					target: type,
					detail: parts.join(' · ') || undefined,
					gate: { feature }
				});
			}
		}
	}

	return items;
}

export const actions = {
	async login({ request, cookies }) {
		const data = await request.formData();
		const secret = data.get('secret') as string;

		const expectedSecret = env.AGENCY_SECRET;
		// Compare fixed-length hashes in constant time
		const matches =
			!!expectedSecret &&
			timingSafeEqual(
				createHmac('sha256', 'agency-login')
					.update(secret ?? '')
					.digest(),
				createHmac('sha256', 'agency-login').update(expectedSecret).digest()
			);
		if (!matches) {
			return fail(401, { error: 'Falsches Passwort' });
		}

		// Signiertes Auth-Cookie (gültig für 1 Stunde)
		cookies.set(AUTH_COOKIE, createAuthCookie(expectedSecret), {
			httpOnly: true,
			secure: !dev, // Lokal http://localhost erlauben
			sameSite: 'strict',
			maxAge: AUTH_MAX_AGE_SECONDS,
			path: '/'
		});

		throw redirect(303, '/agency/gating');
	},

	async logout({ cookies }) {
		cookies.delete(AUTH_COOKIE, { path: '/' });
		throw redirect(303, '/agency/gating');
	},

	async save({ request, cookies }) {
		if (!isAuthenticated(cookies.get(AUTH_COOKIE))) throw error(403, 'Nicht authentifiziert');

		const data = await request.formData();
		const plan = data.get('plan') as string;
		const selectedOverrides = JSON.parse(data.get('overrides') as string);
		const sectionsDisabled = JSON.parse((data.get('admin_sections_disabled') as string) || '[]');

		// Load gating.json
		const gating = read(GATING_PATH);

		// 1. Update plan in slicemachine.config.json (nur bei Änderung)
		const smConfig = read(SM_CONFIG_PATH);
		const planChanged = smConfig.plan !== plan;
		if (planChanged) {
			smConfig.plan = plan;
			write(SM_CONFIG_PATH, smConfig);
		}

		// 2. Write gating.overrides.json mit enabled + disabled
		const planChain = getActivePlanChain(plan, gating.plans);
		const planFeatures = getActiveFeatures(planChain, gating.features);
		const enabled = selectedOverrides.filter((f: string) => !planFeatures.includes(f));
		const disabled = planFeatures.filter((f: string) => !selectedOverrides.includes(f));

		const existingOverrides = existsSync(OVERRIDES_PATH)
			? read(OVERRIDES_PATH)
			: { enabled: [], disabled: [], admin_sections_disabled: [] };
		const overridesChanged =
			JSON.stringify([...(existingOverrides.enabled ?? [])].sort()) !==
				JSON.stringify([...enabled].sort()) ||
			JSON.stringify([...(existingOverrides.disabled ?? [])].sort()) !==
				JSON.stringify([...disabled].sort()) ||
			JSON.stringify([...(existingOverrides.admin_sections_disabled ?? [])].sort()) !==
				JSON.stringify([...sectionsDisabled].sort());

		write(OVERRIDES_PATH, { enabled, disabled, admin_sections_disabled: sectionsDisabled });

		// 3. Run build-customtypes.js nur wenn sich etwas verändert hat
		if (!planChanged && !overridesChanged) {
			throw redirect(303, '/agency/gating');
		}
		try {
			execSync('node scripts/build-customtypes.js', { stdio: 'inherit', cwd: ROOT });
		} catch (e) {
			console.error('build-customtypes.js failed:', e);
			throw error(500, 'Fehler beim Generieren der Modelle');
		}

		throw redirect(303, '/agency/gating');
	},

	// Global plan definition: minimum plan per feature in gating.json (affects all branches)
	async savePlanDefinition({ request, cookies }) {
		if (!isAuthenticated(cookies.get(AUTH_COOKIE))) {
			throw error(403, 'Nicht authentifiziert');
		}
		if (!dev) throw error(403, 'Nur auf dem lokalen Dev-Server möglich');

		const data = await request.formData();
		const featurePlans: Record<string, string> = JSON.parse(
			(data.get('feature_plans') as string) || '{}'
		);

		const gating = read(GATING_PATH);
		let changed = false;
		for (const [featureId, planKey] of Object.entries(featurePlans)) {
			const feature = gating.features?.[featureId];
			if (!feature || !gating.plans?.[planKey]) continue;
			const current: string[] = feature.plans ?? [];
			if (current.length === 1 && current[0] === planKey) continue;
			feature.plans = [planKey];
			changed = true;
		}

		if (!changed) throw redirect(303, '/agency/gating');

		write(GATING_PATH, gating);
		try {
			execSync('node scripts/build-customtypes.js', { stdio: 'inherit', cwd: ROOT });
		} catch (e) {
			console.error('build-customtypes.js failed:', e);
			throw error(500, 'Fehler beim Generieren der Modelle');
		}

		throw redirect(303, '/agency/gating');
	}
};

function getActivePlanChain(
	planKey: string,
	plans: Record<string, { extends?: string }>
): string[] {
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
