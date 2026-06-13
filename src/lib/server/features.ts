import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

export function isFeatureActive(featureName: string): boolean {
	const gating = JSON.parse(readFileSync(join(ROOT, 'gating.json'), 'utf-8'));
	const config = JSON.parse(readFileSync(join(ROOT, 'slicemachine.config.json'), 'utf-8'));

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
