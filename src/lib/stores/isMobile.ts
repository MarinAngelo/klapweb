import { writable } from 'svelte/store';

function createIsMobileStore() {
	const { subscribe, set } = writable(false);
	let locked = false;

	function checkIsMobile() {
		if (locked) return;
		if (typeof window === 'undefined') return;

		const mq = window.matchMedia('(max-width: 639px)');
		const isLandscape = window.matchMedia('(orientation: landscape)').matches;
		const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

		set(mq.matches || (isTouchDevice && isLandscape && window.innerHeight <= 500));
	}

	if (typeof window !== 'undefined') {
		checkIsMobile();
		window.addEventListener('resize', checkIsMobile);
		window.addEventListener('orientationchange', checkIsMobile);
	}

	return {
		subscribe,
		set,
		/** Setzt den Wert und verhindert Überschreiben durch Resize-Listener */
		forceSet(val: boolean) {
			locked = true;
			set(val);
		},
		/** Gibt die automatische Erkennung wieder frei */
		unlock() {
			locked = false;
			checkIsMobile();
		}
	};
}

export const isMobile = createIsMobileStore();

// ... Rest deiner Datei (isLandscape) ...

export function isLandscape() {
	if (typeof window !== 'undefined') {
		const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
		const isLandscape = window.matchMedia('(orientation: landscape)').matches;

		// DEBUG: Wenn wir auf localhost sind, ignorieren wir den Touch-Check
		// damit du es im Browser testen kannst
		if (window.location.hostname === 'localhost') {
			return isLandscape; // Auf localhost reicht Querformat zum Testen
		}

		return isTouchDevice && isLandscape;
	}
	return false;
}
