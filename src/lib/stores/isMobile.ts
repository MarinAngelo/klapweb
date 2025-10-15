import { writable } from 'svelte/store';

function createIsMobileStore() {
	const { subscribe, set } = writable(false);

	function checkIsMobile() {
		set(window.matchMedia('(max-width: 639px)').matches);
	}

	if (typeof window !== 'undefined') {
		checkIsMobile();
		window.addEventListener('resize', checkIsMobile);
	}

	return { subscribe };
}

export const isMobile = createIsMobileStore();
