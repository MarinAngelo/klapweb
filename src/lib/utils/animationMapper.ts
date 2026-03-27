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
		Rechts: 'right'
		// 'Keine' bewusst nicht hier – wird separat als Fade-in (distance: '0px') behandelt
	};

	// "Keine" = Fade-in ohne Bewegung: direction bleibt 'up', aber distance auf 0 setzen
	const isNoDirection = direction === 'Keine';

	return {
		animate: !!animate,
		options: {
			direction: directionMap[direction || ''] ?? 'up',
			...(isNoDirection && { distance: '0px' }),
			delay: delay ?? 100,
			duration: duration ?? 2000
		}
	};
}

/**
 * Kurzform für Slices: Liest die Animations-Felder direkt aus slice.primary.
 * Alle Slices mit animate / anim_direction / anim_delay / anim_duration
 * können statt 4 Parametern einfach das ganze primary-Objekt übergeben.
 */
export function mapAnimationFromPrimary(
	primary:
		| {
				animate?: boolean | null;
				anim_direction?: string | null;
				anim_delay?: number | null;
				anim_duration?: number | null;
				[key: string]: unknown;
		  }
		| null
		| undefined
): { animate: boolean; options: RevealOptions } {
	if (!primary) return mapAnimation(false, null, null, null);
	return mapAnimation(
		primary.animate,
		primary.anim_direction,
		primary.anim_delay,
		primary.anim_duration
	);
}
