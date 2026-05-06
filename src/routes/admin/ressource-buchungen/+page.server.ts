import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { listAlleRessourceBuchungen, deleteRessourceBuchung, updateRessourceBuchungStatus } from '$lib/server/ressourceBuchungen';
import { listAnnahmenFuerBuchung } from '$lib/server/aufgaben';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

	let buchungen: Awaited<ReturnType<typeof listAlleRessourceBuchungen>> = [];
	let blobError: string | null = null;

	try {
		buchungen = await listAlleRessourceBuchungen();
	} catch (e) {
		blobError = String(e);
	}

	// Annahmen pro Buchung laden (non-critical)
	const annahmenMap: Record<string, Awaited<ReturnType<typeof listAnnahmenFuerBuchung>>> = {};
	await Promise.all(
		buchungen.map(async (b) => {
			try {
				annahmenMap[b.id] = await listAnnahmenFuerBuchung(b.id);
			} catch { annahmenMap[b.id] = []; }
		})
	);

	return { buchungen, blobError, annahmenMap };
};

export const actions: Actions = {
	delete: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		if (typeof id === 'string' && id) {
			await deleteRessourceBuchung(id);
		}
	},

	bestaetigen: async ({ request, url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');

		const form = await request.formData();
		const id = form.get('id');
		const emailFrom = env.INVOICE_FROM_EMAIL;
		const resendKey = env.RESEND_API_KEY;

		if (typeof id !== 'string' || !id) return;

		const buchung = await updateRessourceBuchungStatus(id, 'confirmed');

		// Bestätigungsmail an Mieter senden
		if (resendKey && emailFrom && buchung.email) {
			const vonFormatted = new Date(buchung.von + 'T12:00:00Z').toLocaleDateString('de-CH', {
				weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
			});
			const bisFormatted = new Date(buchung.bis + 'T12:00:00Z').toLocaleDateString('de-CH', {
				weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
			});
			const naechte = Math.round(
				(new Date(buchung.bis).getTime() - new Date(buchung.von).getTime()) / 86400000
			);
			const preisFormatted = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(buchung.preisCHF);
			const zimmerZeilen = (buchung.zimmerauswahl ?? []).map(
				(z: any) => `           · ${z.zimmer_name || z.bett_typ} (${z.anzahl_betten}× ${z.bett_typ})`
			);
			const buchungsDetails = [
				`Ressource: ${buchung.ressourceName ?? buchung.ressourceUid} (${buchung.ressourceUid})`,
				`Anreise:   ${vonFormatted}`,
				`Abreise:   ${bisFormatted}`,
				`Nächte:    ${naechte}`,
				`Personen:  ${buchung.personen}`,
				...(zimmerZeilen.length ? [`Zimmer:`, ...zimmerZeilen] : [`Zimmer:    Ganze Wohnung`]),
				`Total:     ${preisFormatted}`
			].join('\n');

			const { Resend } = await import('resend');
			const resend = new Resend(resendKey);
			const { error: mailError } = await resend.emails.send({
				from: emailFrom,
				to: buchung.email,
				subject: `Buchungsbestätigung: ${buchung.ressourceName ?? buchung.ressourceUid}`,
				text: [
					`Guten Tag ${buchung.name}`,
					``,
					`Ihre Buchungsanfrage wurde bestätigt.`,
					``,
					buchungsDetails,
					``,
					...(buchung.referenz ? [
						`Ihre Buchungsreferenz: ${buchung.referenz}`,
						`(Diese benötigen Sie für den Check-in und Check-out auf unserer Website.)`,
						``
					] : []),
					`Wir melden uns in Kürze zur Zahlungsabwicklung.`,
					``,
					`Freundliche Grüsse`
				].join('\n')
			});
			if (mailError) {
				console.error('Bestätigungsmail fehlgeschlagen:', mailError);
			}
		}
	}
};
