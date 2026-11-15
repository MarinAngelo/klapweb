import { writable } from 'svelte/store';

// true wenn +error.svelte eine Prismic-Seite als Landing Page rendert (kein Chrome)
export const errorPageLanding = writable(false);
