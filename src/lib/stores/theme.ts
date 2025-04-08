import { writable } from 'svelte/store';

export const theme = writable({
    headerColor: 'var(--header-color)', // Fallback-Wert
    bgColor: 'var(--header-bg-color)', // Fallback-Wert
    bgOpacity: 1, // Fallback-Wert
});