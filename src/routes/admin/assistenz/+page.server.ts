import type { PageServerLoad } from './$types';
import { jahrVonMonat, monateDesJahres, type AssistenzConfig } from '$lib/assistenz';
import { loadConfig, loadMonate } from '$lib/server/assistenz';

export const prerender = false;

/** Current month in Swiss time, «YYYY-MM» */
const aktuellerMonat = () =>
	new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Zurich' }).slice(0, 7);

// Access: /admin/* is protected centrally in hooks.server.ts (admin session)
export const load: PageServerLoad = async ({ url }) => {
	try {
		const config: AssistenzConfig = await loadConfig();
		const param = Number(url.searchParams.get('jahr'));
		const jahr =
			Number.isInteger(param) && param > 2000 && param < 2200
				? param
				: jahrVonMonat(aktuellerMonat(), config.jahresbeginn);
		const daten = await loadMonate(monateDesJahres(jahr, config.jahresbeginn));
		return { config, jahr, daten, aktuellerMonat: aktuellerMonat(), loadError: null };
	} catch (e) {
		console.error('[admin/assistenz] Laden fehlgeschlagen:', e);
		return {
			config: null,
			jahr: 0,
			daten: {},
			aktuellerMonat: aktuellerMonat(),
			loadError: e instanceof Error ? e.message : String(e)
		};
	}
};
