import { writable } from 'svelte/store';

/** Set by product pages that have additional currencies configured. Null = use base currency as-is. */
export const currencySelection = writable<{ code: string; rates: Record<string, number> } | null>(
	null
);
