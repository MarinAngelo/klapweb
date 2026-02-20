import { derived } from 'svelte/store';
import { page } from '$app/stores';
import { t } from '$lib/i18n/translations';

/**
 * Der _ Store (Unterstrich ist Konvention für Übersetzungen)
 * Er leitet sich vom SvelteKit Page-Store ab.
 * Sobald sich die URL ändert (z.B. von /de-ch auf /en-us),
 * aktualisiert sich dieser Store automatisch.
 */
export const _ = derived(page, ($page) => {
	// Hol dir die Sprache vom Server (data.lang) oder Fallback
	const lang = $page.data.lang || 'de-ch';
	return (key: string) => t(key, lang);
});