import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'fs';
import { overridesFromConfig } from './src/lib/gatingOverrides.js';

// Register the SW only if feature pwa is active (plan or branch switch in slicemachine.config.json)
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

		// Branch switches (features / featuresDisabled), same as src/lib/server/features.ts
		const overrides = overridesFromConfig(smConfig);

		const pwaPlans = gating.features?.pwa?.plans ?? [];
		const inPlan = pwaPlans.some((p) => chain.includes(p));
		if (overrides.enabled.includes('pwa')) return true;
		if (overrides.disabled.includes('pwa')) return false;
		return inPlan;
	} catch {
		return false;
	}
}

// Never in the dev server: it would intercept and cache the Vite modules (stale code, hanging tabs)
const isDevServer = process.argv.includes('dev');
const registerServiceWorker = isPwaActive() && !isDevServer;
console.log(
	`Service Worker: ${registerServiceWorker ? 'aktiv' : 'deaktiviert'} (pwa-Feature${isDevServer ? ', Dev-Server' : ''})`
);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),

		serviceWorker: {
			register: registerServiceWorker
		},

		prerender: {
			entries: ['*', '/sitemap.xml', '/robots.txt', '/im-aufbau'],
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
