import { writable } from 'svelte/store';

// Global token map: { "PreisA": "100.00", "USD": "1.1234", ... }
export const variables = writable<Record<string, string>>({});

// Multi-line variables (rich text): a token alone in a paragraph is replaced by these paragraphs
export const richVariables = writable<Record<string, any[]>>({});
