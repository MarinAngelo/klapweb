import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import {
	listAlleAnnahmen,
	updateAnnahme,
	deleteAnnahme,
	getAnnahme,
	berechneCredits
} from '$lib/server/aufgaben';
import { getRessourceBuchung } from '$lib/server/ressourceBuchungen';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

	let annahmen: Awaited<ReturnType<typeof listAlleAnnahmen>> = [];
	let blobError: string | null = null;

	try {
		annahmen = await listAlleAnnahmen();
	} catch (e) {
		blobError = String(e);
	}

	return { annahmen, blobError, secret: provided };
};

export const actions: Actions = {
	bestaetigen: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

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
		const emailFrom = env.INVOICE_FROM_EMAIL;

		if (resendKey && emailFrom && annahme.email) {
			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);
			await resend.emails
				.send({
					from: emailFrom,
					to: annahme.email,
					subject: `Aufgabe bestätigt: ${annahme.aufgabeTitel}`,
					text: [
						`Guten Tag ${annahme.name}`,
						``,
						`Ihre Aufgabe wurde vom Betreiber bestätigt und kann nun erledigt werden.`,
						``,
						`Aufgabe: ${annahme.aufgabeTitel}`,
						`Credits: ${annahme.creditTyp === 'fest' ? `${annahme.creditBetrag ?? 0} Credits (Fest)` : 'Zeitbasiert (Minuten × Preis/Nacht)'}`,
						``,
						`Bitte melden Sie sich nach Erledigung auf unserer Website an und geben Sie die Aufgabe ab.`,
						`Buchungs-ID: ${annahme.buchungId}`,
						``,
						`Freundliche Grüsse`
					].join('\n')
				})
				.then(({ error: e }) => {
					if (e) console.error('Aufgabe Bestätigungs-Mail fehlgeschlagen:', e);
				});
		}
	},

	freigeben: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

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

		const resendKey = env.RESEND_API_KEY;
		const emailFrom = env.INVOICE_FROM_EMAIL;

		if (resendKey && emailFrom && annahme.email) {
			try {
				const fmt = (n: number) =>
					new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(n);

				let buchungspreis: number | null = null;
				try {
					const buchung = await getRessourceBuchung(annahme.buchungId);
					if (buchung) buchungspreis = buchung.preisCHF;
				} catch {
					/* non-critical */
				}

				const finalCredits = updated.credits ?? 0;
				const diff = adjustment;

				const abrechnungsZeilen = [
					`Aufgabe:             ${annahme.aufgabeTitel}`,
					`Credit-Typ:          ${annahme.creditTyp === 'offen' ? 'Zeitbasiert' : 'Fest'}`,
					...(annahme.minuten ? [`Geleistete Zeit:     ${annahme.minuten} Minuten`] : []),
					...(annahme.kommentar ? [`Ihr Kommentar:       ${annahme.kommentar}`] : []),
					``,
					`Berechnete Credits:  ${fmt(baseCredits)}`,
					...(diff !== 0 ? [`Anpassung:           ${diff > 0 ? '+' : ''}${fmt(diff)}`] : []),
					`Credits total:       ${fmt(finalCredits)}`,
					...(buchungspreis != null
						? [
								``,
								`Buchungspreis:       ${fmt(buchungspreis)}`,
								`Abzug Credits:       ${fmt(finalCredits)}`,
								`Restbetrag:          ${fmt(Math.max(0, buchungspreis - finalCredits))}`
							]
						: [])
				].join('\n');

				const { Resend } = await import('resend');
				const resend = new Resend(resendKey);
				const { error: e } = await resend.emails.send({
					from: emailFrom,
					to: annahme.email,
					subject: `Aufgabe freigegeben: ${annahme.aufgabeTitel}`,
					text: [
						`Guten Tag ${annahme.name}`,
						``,
						`Ihre Aufgabe wurde vom Betreiber geprüft und freigegeben.`,
						``,
						abrechnungsZeilen,
						...(betreiberAntwort
							? [``, `─────────────────────────────`, `Antwort des Betreibers:`, betreiberAntwort]
							: []),
						``,
						`Freundliche Grüsse`
					].join('\n')
				});
				if (e) console.error('Freigabe-Mail fehlgeschlagen:', e);
			} catch (e) {
				console.error('E-Mail-Versand fehlgeschlagen:', e);
			}
		}
	},

	erledigt: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

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

		await updateAnnahme(id, {
			status: 'erledigt',
			minuten: annahme.creditTyp === 'offen' ? minuten : undefined,
			credits,
			erledigtAt: new Date().toISOString()
		});
	},

	zuruecksetzen: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await updateAnnahme(id, {
				status: 'angenommen',
				bestaetgtAt: undefined,
				erledigtAt: undefined,
				minuten: undefined,
				credits: undefined
			});
		}
	},

	loeschen: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await deleteAnnahme(id);
		}
	},

	deleteAll: async ({ url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
		const all = await listAlleAnnahmen();
		await Promise.all(all.map((a) => deleteAnnahme(a.id)));
		return { ok: true };
	}
};
