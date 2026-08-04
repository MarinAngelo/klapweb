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

/** @deprecated Verwende die FEATURE_* Konstanten direkt */
export function isFeatureActive(featureName: string): boolean {
	return _check(featureName);
}
