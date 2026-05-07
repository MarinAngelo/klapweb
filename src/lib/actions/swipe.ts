/**
 * Svelte action: erkennt horizontales Swipe via Pointer Events.
 *
 * Verwendung: use:swipe={{ onLeft: next, onRight: prev }}
 */
export function swipe(node: HTMLElement, params: { onLeft?: () => void; onRight?: () => void }) {
	let startX = 0;
	let startY = 0;
	let active = false;

	function onPointerDown(e: PointerEvent) {
		if ((e.target as HTMLElement)?.closest('button, a')) return;
		active = true;
		startX = e.clientX;
		startY = e.clientY;
		node.setPointerCapture(e.pointerId);
	}

	function onPointerUp(e: PointerEvent) {
		if (!active) return;
		active = false;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 40) {
			if (dx < 0) params.onLeft?.();
			else params.onRight?.();
		}
	}

	function onPointerCancel() { active = false; }

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('pointerup', onPointerUp);
	node.addEventListener('pointercancel', onPointerCancel);
	node.style.touchAction = 'pan-y';

	return {
		update(newParams: typeof params) { params = newParams; },
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerCancel);
		}
	};
}
