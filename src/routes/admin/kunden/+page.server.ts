import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { listCustomers, deleteCustomer, saveCustomer, updateCustomer } from '$lib/server/customers';
import { env } from '$env/dynamic/private';
import { createClient } from '$lib/prismicio';

type Language = { id: string; name: string };

/** Languages defined in the Prismic repository (master language first) */
async function loadLanguages(fetch: typeof globalThis.fetch): Promise<Language[]> {
	try {
		const repo = await createClient({ fetch }).getRepository();
		return [...repo.languages]
			.sort((a: any, b: any) => Number(b.is_master === true) - Number(a.is_master === true))
			.map((l: any) => ({ id: l.id, name: l.name }));
	} catch (e) {
		console.error('Prismic-Sprachen konnten nicht geladen werden:', e);
		return [];
	}
}

export const prerender = false;

export const load: PageServerLoad = async ({ url, fetch }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');

	if (!secret || provided !== secret) {
		throw error(403, 'Kein Zugriff');
	}

	let customers: Awaited<ReturnType<typeof listCustomers>> = [];
	let blobError: string | null = null;
	const languagesPromise = loadLanguages(fetch);
	try {
		customers = await listCustomers();
	} catch (e) {
		blobError = e instanceof Error ? e.message : String(e);
		console.error('listCustomers fehlgeschlagen:', e);
	}
	return { customers, blobError, languages: await languagesPromise };
};

export const actions: Actions = {
	create: async ({ request, url, fetch }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const languages = await loadLanguages(fetch);
		const lang = String(form.get('lang') ?? '');

		try {
			await saveCustomer({
				date: new Date().toISOString(),
				paymentMethod: 'manuell',
				service: (form.get('service') as string) || 'Manuell erfasst',
				amount: null,
				currency: 'CHF',
				vorname: form.get('vorname') as string,
				nachname: form.get('nachname') as string,
				firma: (form.get('firma') as string) || undefined,
				email: (form.get('email') as string) || undefined,
				adresse: (form.get('adresse') as string) || undefined,
				plz: (form.get('plz') as string) || undefined,
				ort: (form.get('ort') as string) || undefined,
				land: (form.get('land') as string) || undefined,
				// Only Prismic locales are accepted
				lang: languages.some((l) => l.id === lang) ? lang : undefined
			});

			return { success: true };
		} catch (e) {
			console.error('Kunde erstellen fehlgeschlagen:', e);
			throw error(500, 'Kunde konnte nicht erstellt werden');
		}
	},

	setLang: async ({ request, url, fetch }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const lang = String(form.get('lang') ?? '');
		const languages = await loadLanguages(fetch);
		if (!id) return fail(400, { error: 'Kunde fehlt' });
		if (lang && !languages.some((l) => l.id === lang)) {
			return fail(400, { error: 'Unbekannte Sprache' });
		}
		try {
			await updateCustomer(id, { lang: lang || undefined });
		} catch (e) {
			console.error('Sprache speichern fehlgeschlagen:', e);
			return fail(500, { error: 'Sprache konnte nicht gespeichert werden' });
		}
		return { success: true };
	},

	delete: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await deleteCustomer(id);
		}
	},

	deleteAll: async ({ url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
		const all = await listCustomers();
		await Promise.all(all.map((c) => deleteCustomer(c.id)));
		return { ok: true };
	}
};
