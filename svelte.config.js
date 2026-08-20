import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readFileSync, existsSync } from 'fs';

// SW nur registrieren wenn pwa-Feature im aktiven Plan (oder Override) aktiv ist
function isPwaActive() {
	try {
		const smConfig = JSON.parse(readFileSync('./slicemachine.config.json', 'utf-8'));
		const gating = JSON.parse(readFileSync('./gating.json', 'utf-8'));

		const plan = smConfig.plan || 'basis';
		const chain = [plan];
		let cur = plan;
		while (gating.plans?.[cur]?.extends) {
			cur = gating.plans[cur].extends;
			chain.push(cur);
		}

		let overrides = { enabled: [], disabled: [] };
		if (existsSync('./gating.overrides.json')) {
			overrides = JSON.parse(readFileSync('./gating.overrides.json', 'utf-8'));
		}

		const pwaPlans = gating.features?.pwa?.plans ?? [];
		const inPlan = pwaPlans.some((p) => chain.includes(p));
		const inEnabled = (overrides.enabled ?? []).includes('pwa');
		const inDisabled = (overrides.disabled ?? []).includes('pwa');
		return (inPlan || inEnabled) && !inDisabled;
	} catch {
		return false;
	}
}

const registerServiceWorker = isPwaActive();
console.log(`Service Worker: ${registerServiceWorker ? 'aktiv' : 'deaktiviert'} (pwa-Feature)`);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),

		serviceWorker: {
			register: registerServiceWorker
		},

		prerender: {
			// Verhindert den Build-Abbruch bei toten Links im CMS
			handleHttpError: ({ path, referrer, message }) => {
				// 404 Fehler (tote Links) werden geloggt, aber der Build läuft weiter
				if (message.includes('404')) {
					console.warn(`⚠️ Prerender 404: ${path} (Verlinkt auf: ${referrer})`);
					return;
				}

				// Echte technische Fehler (500) führen weiterhin zum Abbruch (Sicherheit!)
				throw new Error(message);
			},
			// Anker-IDs werden client-seitig gesetzt (headingAnchor action) → im SSR-HTML nicht vorhanden
			handleMissingId: 'ignore'
		}
	}
};

export default config;
