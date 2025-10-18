import { writable } from 'svelte/store';

function createIsMobileStore() {
	const { subscribe, set } = writable(false);

	function checkIsMobile() {
		const mq = window.matchMedia('(max-width: 639px)');
		const isLandscape = window.matchMedia('(orientation: landscape)').matches;
		const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

		// Mobile, wenn entweder die Breite <= 639px ODER ein Touchgerät im Landscape-Modus
		set(mq.matches || (isTouchDevice && isLandscape && window.innerHeight <= 500));
	}

	if (typeof window !== 'undefined') {
		checkIsMobile();
		window.addEventListener('resize', checkIsMobile);
		window.addEventListener('orientationchange', checkIsMobile);
	}

	return { subscribe };
}

export const isMobile = createIsMobileStore();

export function isLandscape() {
	if (typeof window !== 'undefined') {
		return window.matchMedia('(orientation: landscape)').matches;
	}
	return false;
}
