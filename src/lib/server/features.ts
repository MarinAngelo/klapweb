import gating from '../../../gating.json' assert { type: 'json' };
import config from '../../../slicemachine.config.json' assert { type: 'json' };
import { overridesFromConfig } from '$lib/gatingOverrides.js';

/**
 * Agency switches of this branch (slicemachine.config.json: features / featuresDisabled /
 * adminSectionsDisabled). Static import → build-time constant, valid in production.
 */
export const CONFIG_OVERRIDES = overridesFromConfig(config);

const plan = (config as any).plan || 'basis';
const planChain: string[] = [plan];
let _current = plan;
while ((gating.plans as any)[_current]?.extends) {
	_current = (gating.plans as any)[_current].extends;
	planChain.push(_current);
}

/** Feature of the plan only (without switches) */
function _planHas(featureName: string): boolean {
	const feature = (gating.features as any)[featureName];
	if (!feature) return false;
	return (feature.plans ?? []).some((p: string) => planChain.includes(p));
}

/** Feature active: plan + add-ons of this branch − switched off */
function _check(featureName: string): boolean {
	if (!(gating.features as any)[featureName]) return false;
	return isFeatureActiveWithOverrides(featureName, CONFIG_OVERRIDES);
}

export const FEATURE_CHATBOT = _check('chatbot');
export const FEATURE_KLAPSTUDIO = _check('klapstudio');
export const FEATURE_TERMINBUCHUNG = _check('terminbuchung');
export const FEATURE_ECOMMERCE = _check('ecommerce');
export const FEATURE_NEWSLETTER = _check('newsletter');
export const FEATURE_KUNDENKONTO = _check('kundenkonto');
export const FEATURE_KUNDENVERWALTUNG = _check('kundenverwaltung');
export const FEATURE_RESSOURCENBUCHUNG = _check('ressourcenbuchung');
export const FEATURE_STUNDENABRECHNUNG = _check('stundenabrechnung');
export const FEATURE_PWA = _check('pwa');

type Gate = { plan?: string; feature?: string; features?: string[] };
type FeatureOverrides = { enabled?: string[]; disabled?: string[] };

function isFeatureActiveWithOverrides(feature: string, overrides: FeatureOverrides): boolean {
	if (overrides.enabled?.includes(feature)) return true;
	if (overrides.disabled?.includes(feature)) return false;
	return _planHas(feature);
}

/**
 * Same semantics as isActive() in scripts/build-customtypes.js:
 * plan gate → plan in active chain; feature gate → feature active incl. branch switches
 * (slicemachine.config.json);
 * features gate (array) → at least one of the features active (OR)
 */
export function isGateActive(
	gate: Gate | undefined,
	overrides: FeatureOverrides = CONFIG_OVERRIDES
): boolean {
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
export function getGatedAdminSections(overrides: FeatureOverrides = CONFIG_OVERRIDES): string[] {
	const sections = ((gating as any).admin_sections ?? {}) as Record<string, Gate>;
	return Object.entries(sections)
		.filter(([, def]) => !isGateActive(def, overrides))
		.map(([id]) => id);
}

/** @deprecated Verwende die FEATURE_* Konstanten direkt */
export function isFeatureActive(featureName: string): boolean {
	return _check(featureName);
}
