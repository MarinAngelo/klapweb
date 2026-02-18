// src/lib/utils/animationMapper.ts
import type { RevealOptions } from '$lib/actions/reveal';

/**
 * Mappt die deutschen Begriffe aus dem Prismic CMS auf die
 * englischen technischen Begriffe der Reveal-Action.
 */
export function mapAnimation(
	animate: boolean | null | undefined,
	direction: string | null | undefined,
	delay: number | null | undefined,
	duration?: number | null
): { animate: boolean; options: RevealOptions } {
	const directionMap: Record<string, RevealOptions['direction']> = {
		Oben: 'up',
		Unten: 'down',
		Links: 'left',
		Rechts: 'right',
		Keine: 'none'
	};

	return {
		animate: !!animate, // Wandelt null/undefined sicher in boolean um
		options: {
			direction: directionMap[direction || ''] || 'up',
			delay: delay || 0,
			duration: duration ?? 800 // Standarddauer, falls nicht gesetzt
		}
	};
}
