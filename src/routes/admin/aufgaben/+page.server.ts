import type { PageServerLoad, Actions } from './$types';
import {
	listAlleAnnahmen,
	updateAnnahme,
	deleteAnnahme,
	getAnnahme,
	berechneCredits
} from '$lib/server/aufgaben';
import { getRessourceBuchung } from '$lib/server/ressourceBuchungen';
import { bonusEntfernen, bonusPruefen, loadKatalog } from '$lib/server/aufgabenKatalog';
import { env } from '$env/dynamic/private';
import { getMailFrom, getTextStyle } from '$lib/server/mailFrom';
import { createClient } from '$lib/prismicio';
import { loadMailTheme } from '$lib/mailLayout.js';
import { taskApprovedMail, taskConfirmedMail } from '$lib/server/aufgabenMails';

export const prerender = false;

export const load: PageServerLoad = async ({ fetch }) => {
	let annahmen: Awaited<ReturnType<typeof listAlleAnnahmen>> = [];
	let blobError: string | null = null;

	try {
		annahmen = await listAlleAnnahmen();
	} catch (e) {
		blobError = String(e);
	}

	// Current priority per task uid (from Prismic, may change after acceptance)
	let prioritaeten: Record<string, string> = {};
	try {
		prioritaeten = Object.fromEntries((await loadKatalog(fetch)).map((a) => [a.uid, a.prioritaet]));
	} catch {
		/* non-critical */
	}

	return { annahmen, blobError, prioritaeten };
};

export const actions: Actions = {
	bestaetigen: async ({ request, fetch }) => {
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !id) return;

		const annahme = await getAnnahme(id);
		if (!annahme) return;

		await updateAnnahme(id, {
			status: 'annahme_bestaetigt',
			bestaetgtAt: new Date().toISOString()
		});

		const resendKey = env.RESEND_API_KEY;
		const emailFrom = await getMailFrom();

		if (resendKey && emailFrom && annahme.email) {
			const [style, theme] = await Promise.all([
				getTextStyle(),
				loadMailTheme(createClient({ fetch })).catch(() => null)
			]);
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);
			await resend.emails
				.send({
					from: emailFrom,
					to: annahme.email,
					...taskConfirmedMail({
						titel: annahme.aufgabeTitel,
						name: annahme.name,
						creditTyp: annahme.creditTyp,
						creditBetrag: annahme.creditBetrag,
						buchungId: annahme.buchungId,
						style,
						theme
					})
				})
				.then(({ error: e }) => {
					if (e) console.error('Aufgabe Bestätigungs-Mail fehlgeschlagen:', e);
				});
		}
	},

	freigeben: async ({ request, fetch }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		const betreiberAntwort = (form.get('betreiber_antwort') as string)?.trim() || undefined;
		const creditsRaw = form.get('credits');
		if (!id) return;

		const annahme = await getAnnahme(id);
		if (!annahme) return;

		const adjustment = creditsRaw !== null && creditsRaw !== '' ? Number(creditsRaw) : 0;
		const baseCredits = annahme.credits ?? annahme.creditBetrag ?? 0;
		const credits = Math.round((baseCredits + adjustment) * 100) / 100;

		const updated = await updateAnnahme(id, {
			status: 'erledigt',
			credits,
			betreiberAntwort,
			erledigtAt: new Date().toISOString()
		});
		await bonusPruefen(updated, fetch);

		const resendKey = env.RESEND_API_KEY;
		const emailFrom = await getMailFrom();

		if (resendKey && emailFrom && annahme.email) {
			try {
				let buchungspreis: number | null = null;
				try {
					const buchung = await getRessourceBuchung(annahme.buchungId);
					if (buchung) buchungspreis = buchung.preisCHF;
				} catch {
					/* non-critical */
				}

				const { Resend } = await import('resend');
				const resend = new Resend(resendKey);
				const { error: e } = await resend.emails.send({
					from: emailFrom,
					to: annahme.email,
					...taskApprovedMail({
						titel: annahme.aufgabeTitel,
						name: annahme.name,
						creditTyp: annahme.creditTyp,
						minuten: annahme.minuten,
						kommentar: annahme.kommentar,
						baseCredits,
						adjustment,
						finalCredits: updated.credits ?? 0,
						buchungspreis,
						betreiberAntwort,
						style: await getTextStyle(),
						theme: await loadMailTheme(createClient({ fetch })).catch(() => null)
					})
				});
				if (e) console.error('Freigabe-Mail fehlgeschlagen:', e);
			} catch (e) {
				console.error('E-Mail-Versand fehlgeschlagen:', e);
			}
		}
	},

	erledigt: async ({ request, fetch }) => {
		const form = await request.formData();
		const id = form.get('id');
		const minutenRaw = form.get('minuten');
		if (typeof id !== 'string' || !id) return;

		const annahme = await getAnnahme(id);
		if (!annahme) return;

		const minuten = minutenRaw ? Number(minutenRaw) : undefined;
		const credits = berechneCredits({
			creditTyp: annahme.creditTyp,
			creditBetrag: annahme.creditBetrag,
			preisProNacht: annahme.preisProNacht,
			minuten: annahme.creditTyp === 'offen' ? minuten : undefined
		});

		const updated = await updateAnnahme(id, {
			status: 'erledigt',
			minuten: annahme.creditTyp === 'offen' ? minuten : undefined,
			credits,
			erledigtAt: new Date().toISOString()
		});
		await bonusPruefen(updated, fetch);
	},

	zuruecksetzen: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			const annahme = await getAnnahme(id);
			if (annahme) await bonusEntfernen(annahme);
			await updateAnnahme(id, {
				status: 'angenommen',
				bestaetgtAt: undefined,
				erledigtAt: undefined,
				minuten: undefined,
				credits: undefined
			});
		}
	},

	loeschen: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			const annahme = await getAnnahme(id);
			if (annahme) await bonusEntfernen(annahme);
			await deleteAnnahme(id);
		}
	},

	deleteAll: async () => {
		const all = await listAlleAnnahmen();
		await Promise.all(all.map((a) => deleteAnnahme(a.id)));
		return { ok: true };
	}
};
