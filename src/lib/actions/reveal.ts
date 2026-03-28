/**
 * Interface für die Animations-Optionen.
 * Alle Felder sind optional (?), damit TS nicht meckert, wenn nur Teile übergeben werden.
 */
export interface RevealOptions {
	threshold?: number;
	delay?: number;
	duration?: number;
	distance?: string;
	direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function reveal(node: HTMLElement, params: RevealOptions = {}) {
	const isHeading = /^H[1-6]$/.test(node.tagName);
	const targetOpacity = isHeading ? 'var(--heading-opacity, 1)' : '1';

	if (
		params.direction === 'none' ||
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	) {
		node.style.setProperty('opacity', targetOpacity);
		node.style.transform = 'none';
		return;
	}

	const options = {
		// Wir verringern den threshold für 'down', damit es früher triggert
		threshold: params.direction === 'down' ? 0.01 : (params.threshold ?? 0.1),
		delay: params.delay ?? 100,
		duration: params.duration ?? 2000,
		distance: params.distance ?? '40px', // Etwas mehr Distanz macht es sichtbarer
		direction: params.direction ?? 'up'
	};

	const getTransform = (dir: string, dist: string) => {
		const map: Record<string, string> = {
			// 'up' kommt von unten nach oben (Standard)
			up: `translateY(${dist})`,
			// 'down' kommt von oben nach unten
			down: `translateY(-${dist})`,
			left: `translateX(${dist})`,
			right: `translateX(-${dist})`,
			none: 'none'
		};
		return map[dir] || map.up;
	};

	// Initialer Zustand sicherstellen (SSR setzt bereits opacity:0 via Bounded, hier nur Transform)
	node.style.opacity = '0';
	node.style.willChange = 'transform, opacity';
	node.style.transform = getTransform(options.direction, options.distance);

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					setTimeout(() => {
						node.style.setProperty('opacity', targetOpacity);
						node.style.transform = 'translate(0, 0)';
					}, options.delay);
					observer.unobserve(node);
				}
			});
		},
		{ threshold: options.threshold }
	);

	// Doppeltes requestAnimationFrame stellt sicher, dass der Browser den
	// initialen Zustand (opacity: 0) committed hat, bevor Transition und
	// Observer aktiviert werden – verhindert die Race Condition.
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			node.style.transition = `opacity ${options.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
                                 transform ${options.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
			observer.observe(node);
		});
	});

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
