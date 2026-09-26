import gating from '../../../gating.json' assert { type: 'json' };
import config from '../../../slicemachine.config.json' assert { type: 'json' };

const plan = (config as any).plan || 'basis';
const planChain: string[] = [plan];
let _current = plan;
while ((gating.plans as any)[_current]?.extends) {
	_current = (gating.plans as any)[_current].extends;
	planChain.push(_current);
}

function _check(featureName: string): boolean {
	const feature = (gating.features as any)[featureName];
	if (!feature) return false;
	return (feature.plans ?? []).some((p: string) => planChain.includes(p));
}

export const FEATURE_CHATBOT = _check('chatbot');
export const FEATURE_KLAPSTUDIO = _check('klapstudio');
export const FEATURE_TERMINBUCHUNG = _check('terminbuchung');
export const FEATURE_ECOMMERCE = _check('ecommerce');

type Gate = { plan?: string; feature?: string; features?: string[] };
type FeatureOverrides = { enabled?: string[]; disabled?: string[] };

function isFeatureActiveWithOverrides(feature: string, overrides: FeatureOverrides): boolean {
	if (overrides.enabled?.includes(feature)) return true;
	if (overrides.disabled?.includes(feature)) return false;
	return _check(feature);
}

/**
 * Same semantics as isActive() in scripts/build-customtypes.js:
 * plan gate → plan in active chain; feature gate → feature active incl. gating.overrides.json;
 * features gate (array) → at least one of the features active (OR)
 */
export function isGateActive(gate: Gate | undefined, overrides: FeatureOverrides = {}): boolean {
	if (!gate) return true;
	if (gate.plan && !planChain.includes(gate.plan)) return false;
	if (gate.feature && !isFeatureActiveWithOverrides(gate.feature, overrides)) return false;
	if (
		gate.features?.length &&
		!gate.features.some((f) => isFeatureActiveWithOverrides(f, overrides))
	)
		return false;
	return true;
}

/** IDs of admin sections whose plan/feature gate in gating.json is inactive */
export function getGatedAdminSections(overrides: FeatureOverrides = {}): string[] {
	const sections = ((gating as any).admin_sections ?? {}) as Record<string, Gate>;
	return Object.entries(sections)
		.filter(([, def]) => !isGateActive(def, overrides))
		.map(([id]) => id);
}

/** @deprecated Verwende die FEATURE_* Konstanten direkt */
export function isFeatureActive(featureName: string): boolean {
	return _check(featureName);
}
