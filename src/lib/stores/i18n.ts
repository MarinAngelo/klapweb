import { derived } from 'svelte/store';
import { page } from '$app/stores';
import { t } from '$lib/i18n/translations';
import { uiLang } from '$lib/stores/preferredLang';

/**
 * Der _ Store (Unterstrich ist Konvention für Übersetzungen)
 * Er leitet sich vom SvelteKit Page-Store ab.
 * Sobald sich die URL ändert (z.B. von /de-ch auf /en-us),
 * aktualisiert sich dieser Store automatisch.
 * uiLang (Layout) hat Vorrang: gemerkte Sprache auf Seiten ohne Übersetzung.
 */
export const _ = derived([page, uiLang], ([$page, $uiLang]) => {
	const lang = $uiLang || $page.data.lang || 'de-ch';
	return (key: string) => t(key, lang);
});
