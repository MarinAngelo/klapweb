import { getContext, setContext } from 'svelte';

/**
 * «Vertikaler innerer Abstand» (y_padding, common slice field) for slices that do not handle it
 * themselves: SliceShell provides it, the slice's outermost Bounded claims it (once).
 */
type SliceSpacing = { size: string | null | undefined; claimed: boolean };

const KEY = Symbol('sliceSpacing');

export function provideSliceSpacing(size: string | null | undefined): void {
	setContext<SliceSpacing>(KEY, { size, claimed: false });
}

/** First caller (outermost Bounded of the slice) gets the size; nested ones get undefined */
export function claimSliceSpacing(): string | undefined {
	const spacing = getContext<SliceSpacing | undefined>(KEY);
	if (!spacing || spacing.claimed || !spacing.size) return undefined;
	spacing.claimed = true;
	return spacing.size;
}
