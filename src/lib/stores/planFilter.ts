import { writable } from 'svelte/store';

// Selected plan ID for documentation page filtering. null = show all.
export const planFilter = writable<string | null>(null);

// Map from Prismic feature_gate label → plan IDs where the feature is visible.
// Keep in sync with gating.json features + plan hierarchy.
export const featurePlanMap: Record<string, string[]> = {
	'Terminbuchung': ['professional', 'individuell'],
	'E-Commerce': ['individuell'],
	'P5.js': ['individuell'],
	'Variablen': ['individuell'],
	'Ressourcen-Buchung': ['individuell'],
	'Globale Events': ['professional', 'individuell'],
};

export function isVisibleForPlan(featureGate: string | null | undefined, selectedPlan: string | null): boolean {
	if (!featureGate || !selectedPlan) return true;
	return featurePlanMap[featureGate]?.includes(selectedPlan) ?? true;
}
