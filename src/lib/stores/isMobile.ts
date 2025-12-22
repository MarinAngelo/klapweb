import { writable } from 'svelte/store';

function createIsMobileStore() {
    // Hier holst du dir subscribe und set aus dem writable
    const { subscribe, set } = writable(false);

    function checkIsMobile() {
        // Sicherstellen, dass window existiert (für SSR wichtig)
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

    // WICHTIG: Hier fehlte 'set'!
    // Wir geben es zurück, damit index.svelte darauf zugreifen kann.
    return { 
        subscribe,
        set 
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
