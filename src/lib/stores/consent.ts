import { derived, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { consentServices, type ConsentCategory } from '$lib/consent/services';

/**
 * Cookie consent (Swiss opt-out model):
 * non-functional services are allowed until the visitor rejects them.
 * The banner only appears on pages that actually use a non-functional service
 * (registered via registerServiceUsage / <ConsentGate>).
 */

const STORAGE_KEY = 'klap_consent';
// Bump when the meaning of stored choices changes → banner is shown again
const CONSENT_VERSION = 1;

type ConsentState = {
	version: number;
	decided: boolean;
	denied: ConsentCategory[];
	decidedAt?: string;
};

const initialState: ConsentState = { version: CONSENT_VERSION, decided: false, denied: [] };

function loadState(): ConsentState {
	if (!browser) return initialState;
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
		if (stored?.version === CONSENT_VERSION && Array.isArray(stored.denied)) return stored;
	} catch {
		// Storage blocked or corrupt → treat as undecided
	}
	return initialState;
}

export const consent = writable<ConsentState>(loadState());

consent.subscribe((state) => {
	if (!browser || !state.decided) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Storage blocked → choice lasts for this page view only
	}
});

const nonFunctionalCategories = (): ConsentCategory[] => [
	...new Set(
		Object.values(consentServices)
			.map((service) => service.category)
			.filter((category) => category !== 'functional')
	)
];

function decide(denied: ConsentCategory[]) {
	consent.set({
		version: CONSENT_VERSION,
		decided: true,
		denied,
		decidedAt: new Date().toISOString()
	});
}

export const acceptAll = () => decide([]);
export const rejectAll = () => decide(nonFunctionalCategories());
export const saveAllowedCategories = (allowed: ConsentCategory[]) =>
	decide(nonFunctionalCategories().filter((category) => !allowed.includes(category)));

export function allowCategory(category: ConsentCategory) {
	consent.update((state) => ({
		...state,
		decided: true,
		denied: state.denied.filter((c) => c !== category),
		decidedAt: new Date().toISOString()
	}));
}

export const isServiceAllowed = derived(consent, ($consent) => (serviceId: string) => {
	const category = consentServices[serviceId]?.category ?? 'external_media';
	return category === 'functional' || !$consent.denied.includes(category);
});

/** Settings dialog (opened from banner or footer link) */
export const consentSettingsOpen = writable(false);

// ── Usage registry: which services does the current page use? ──────────────
const usageCounts = writable<Record<string, number>>({});

/** Call on mount of a component that loads a service; returns the unregister function */
export function registerServiceUsage(serviceId: string): () => void {
	if (!consentServices[serviceId]) {
		console.warn(`[consent] Dienst "${serviceId}" ist nicht in consent/services.ts registriert`);
	}
	usageCounts.update((counts) => ({ ...counts, [serviceId]: (counts[serviceId] ?? 0) + 1 }));
	return () =>
		usageCounts.update((counts) => ({ ...counts, [serviceId]: (counts[serviceId] ?? 1) - 1 }));
}

/** Non-functional services used on the current page */
export const usedServices = derived(usageCounts, ($counts) =>
	Object.keys($counts).filter(
		(id) => $counts[id] > 0 && (consentServices[id]?.category ?? 'external_media') !== 'functional'
	)
);
