import gating from '../../../gating.json' assert { type: 'json' };
import config from '../../../slicemachine.config.json' assert { type: 'json' };

export function isFeatureActive(featureName: string): boolean {

	const plan = config.plan || 'basis';
	const planChain = [plan];
	let current = plan;
	while (gating.plans[current]?.extends) {
		current = gating.plans[current].extends;
		planChain.push(current);
	}

	const feature = gating.features[featureName];
	if (!feature) return false;

	return (feature.plans ?? []).some((p: string) => planChain.includes(p));
}
