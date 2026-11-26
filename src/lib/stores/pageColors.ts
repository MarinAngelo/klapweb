import { derived, type Readable } from 'svelte/store';
import { getContext, setContext } from 'svelte';
import { theme } from '$lib/stores/theme';

/**
 * Page text/background colors for slices and their components. Same as the theme, but swapped
 * inside a slice with «Seitenfarben umkehren» (set by $lib/components/InvertScope.svelte).
 * Use instead of $theme.pageColor / $theme.pageBgColor in anything rendered inside a slice.
 * Must be called during component initialisation (uses Svelte context).
 */
export type PageColors = { pageColor: string; pageBgColor: string };

const KEY = Symbol('pageColors');

const themeColors: Readable<PageColors> = derived(theme, (t) => ({
	pageColor: t.pageColor,
	pageBgColor: t.pageBgColor
}));

const invertedColors: Readable<PageColors> = derived(theme, (t) => ({
	pageColor: t.pageBgColor,
	pageBgColor: t.pageColor
}));

export function pageColors(): Readable<PageColors> {
	return getContext<Readable<PageColors> | undefined>(KEY) ?? themeColors;
}

/** Called by InvertScope: all descendants get swapped page colors */
export function provideInvertedPageColors(): void {
	setContext(KEY, invertedColors);
}
