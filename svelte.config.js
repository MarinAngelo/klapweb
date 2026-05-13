import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto ist super für Vercel/Netlify.
		// Für einen VPS (Ubuntu) würdest du später evtl. auf @sveltejs/adapter-node wechseln.
		adapter: adapter(),

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
