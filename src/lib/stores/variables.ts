import { writable } from 'svelte/store';

// Global token map: { "PreisA": "100.00", "USD": "1.1234", ... }
export const variables = writable<Record<string, string>>({});
