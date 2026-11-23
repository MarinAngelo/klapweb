import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { FEATURE_ASSISTENZ } from '$lib/server/features';
import {
	MAX_IMPORT_BYTES,
	importAnwenden,
	leseDatei,
	parseImport
} from '$lib/server/assistenzImport';
import { loadConfig } from '$lib/server/assistenz';

export const prerender = false;

// Access: /admin/* is protected centrally in hooks.server.ts (admin session)
export const load: PageServerLoad = async () => {
	if (!FEATURE_ASSISTENZ) throw error(404, 'Nicht gefunden');
	return { jahresbeginn: (await loadConfig()).jahresbeginn };
};

export const actions: Actions = {
	/** «Prüfen» (dry run) and «Importieren» share this action: field `modus` */
	default: async ({ request }) => {
		if (!FEATURE_ASSISTENZ) throw error(404, 'Nicht gefunden');
		const form = await request.formData();
		const datei = form.get('datei');
		if (!(datei instanceof File) || datei.size === 0) {
			return fail(400, { error: 'Bitte eine Datei auswählen.' });
		}
		if (datei.size > MAX_IMPORT_BYTES) {
			return fail(400, { error: 'Die Datei ist zu gross (höchstens 5 MB).' });
		}
		const gelesen = leseDatei(datei.name, Buffer.from(await datei.arrayBuffer()));
		if ('error' in gelesen) return fail(400, { error: gelesen.error });

		const bericht = await importAnwenden(parseImport(gelesen.rows), {
			anwenden: form.get('modus') === 'importieren',
			ueberschreiben: form.get('ueberschreiben') === 'on'
		});
		return { bericht, datei: datei.name };
	}
};
