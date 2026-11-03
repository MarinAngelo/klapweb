import { writable } from 'svelte/store';
import gating from '../../../gating.json';

// Selected plan ID for documentation page filtering. null = show all.
export const planFilter = writable<string | null>(null);

// Plan-Hierarchie auflösen: jeder Plan erbt die Features seiner Eltern.
// z.B. klap-web-ch → individuell → professional → basis
function getPlanChain(planId: string): string[] {
	const chain: string[] = [planId];
	let current = planId;
	const plans = gating.plans as Record<string, { extends?: string }>;
	while (plans[current]?.extends) {
		current = plans[current].extends!;
		chain.push(current);
	}
	return chain;
}

// Map from feature label (CMS feature_gate Select) → plan IDs where visible.
// Wird aus gating.json generiert — einzige Quelle der Wahrheit.
// Key ist das Label, weil das CMS-Select mit Labels arbeitet.
export const featurePlanMap: Record<string, string[]> = Object.fromEntries(
	Object.entries(gating.features as Record<string, { label: string; plans?: string[] }>).map(
		([, def]) => [def.label, def.plans ?? []]
	)
);

export function isVisibleForPlan(
	featureGate: string | null | undefined,
	selectedPlan: string | null
): boolean {
	if (!featureGate || !selectedPlan) return true;
	const allowedPlans = featurePlanMap[featureGate];
	if (!allowedPlans) return true; // Unbekanntes Label → nicht filtern
	// Sichtbar wenn der gewählte Plan (inkl. geerbter Eltern-Pläne) das Feature enthält
	return allowedPlans.some((p) => getPlanChain(selectedPlan).includes(p));
}
