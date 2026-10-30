/**
 * Calls `onShown` once the element is in view and fully visible (no transparent ancestor,
 * i.e. reveal animations are done).
 *
 * Used for map iframes: Chrome throttles cross-origin iframes while they are invisible —
 * the OpenStreetMap tile fade-in then stalls and most tiles stay empty.
 */
function ancestorsOpaque(node: HTMLElement): boolean {
	for (let el: HTMLElement | null = node; el; el = el.parentElement) {
		if (Number(getComputedStyle(el).opacity) < 0.99) return false;
	}
	return true;
}

export function whenShown(node: HTMLElement, onShown: () => void) {
	let poll: ReturnType<typeof setInterval> | undefined;
	const observer = new IntersectionObserver((entries) => {
		if (!entries.some((e) => e.isIntersecting) || poll) return;
		poll = setInterval(() => {
			if (!ancestorsOpaque(node)) return;
			clearInterval(poll);
			observer.disconnect();
			onShown();
		}, 100);
	});
	observer.observe(node);
	return {
		destroy() {
			observer.disconnect();
			clearInterval(poll);
		}
	};
}
