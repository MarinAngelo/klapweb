import type { PageServerLoad, Actions } from './$types';
import { loadMailTheme } from '$lib/mailLayout.js';
import { loadVariablesData, mailVariables } from '$lib/variables.js';
import {
	listAlleRessourceBuchungen,
	deleteRessourceBuchung,
	updateRessourceBuchung,
	updateRessourceBuchungStatus,
	getRessourceBuchung,
	type RessourceBuchung
} from '$lib/server/ressourceBuchungen';
import { listAnnahmenFuerBuchung, berechneCredits } from '$lib/server/aufgaben';
import { createClient } from '$lib/prismicio';
import { maybeSendAnkunftsErinnerung, sendAbreiseErinnerung } from '$lib/server/reminderMail';
import { env } from '$env/dynamic/private';
import { adminActionToken } from '$lib/server/adminAuth';
import {
	checkInMail,
	checkoutBillingMail,
	confirmationGuestMail,
	getRessourceDocForBooking,
	type CmsMailContext
} from '$lib/server/ressourceMail';
import { getMailFrom, getNotifyTo, getTextStyle } from '$lib/server/mailFrom';

export const prerender = false;

export const load: PageServerLoad = async () => {
	let buchungen: RessourceBuchung[] = [];
	let blobError: string | null = null;
	try {
		buchungen = await listAlleRessourceBuchungen();
	} catch (e) {
		blobError = String(e);
	}

	const annahmenMap: Record<string, Awaited<ReturnType<typeof listAnnahmenFuerBuchung>>> = {};
	await Promise.all(
		buchungen.map(async (b) => {
			try {
				annahmenMap[b.id] = await listAnnahmenFuerBuchung(b.id);
			} catch {
				annahmenMap[b.id] = [];
			}
		})
	);

	return { buchungen, blobError, annahmenMap };
};

// ── Shared email helpers ───────────────────────────────────────────────────────

async function mailBestaetigung(buchung: RessourceBuchung, fetch: typeof globalThis.fetch) {
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = await getMailFrom();
	if (!resendKey || !emailFrom || !buchung.email) return;

	// CMS template in the booking language (fallback: main language)
	// Standard texts: Du/Sie, Wir/Ich, greeting, closing from the settings
	const cms: CmsMailContext = { doc: null, vars: {}, theme: null, style: await getTextStyle() };
	try {
		const client = createClient({ fetch });
		const [doc, variablesData, theme] = await Promise.all([
			getRessourceDocForBooking(client, buchung),
			loadVariablesData(client),
			loadMailTheme(client, buchung.lang)
		]);
		cms.doc = doc.data as Record<string, any>;
		cms.vars = mailVariables(variablesData, buchung.lang);
		cms.theme = theme;
	} catch {
		// Prismic unavailable — use fallback
	}
	const mail = confirmationGuestMail(buchung, cms);

	const { Resend } = await import('resend');
	const { error: e } = await new Resend(resendKey).emails.send({
		from: emailFrom,
		to: buchung.email,
		subject: mail.subject,
		...(mail.html ? { html: mail.html } : { text: mail.text })
	});
	if (e) console.error('Bestätigungsmail fehlgeschlagen:', e);
}

async function mailCheckIn(buchung: RessourceBuchung, toEmail: string) {
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = await getMailFrom();
	if (!resendKey || !emailFrom || !toEmail) return;

	const { Resend } = await import('resend');
	await new Resend(resendKey).emails.send({
		from: emailFrom,
		to: toEmail,
		...checkInMail(buchung)
	});
}

async function mailAbrechnung(buchung: RessourceBuchung, toEmail: string, freigabeUrl: string) {
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = await getMailFrom();
	if (!resendKey || !emailFrom || !toEmail) return;

	const annahmen = await listAnnahmenFuerBuchung(buchung.id).catch(() => []);
	const erledigt = annahmen.filter((a) => a.status === 'erledigt');
	const creditsCHF = erledigt.reduce((s, a) => s + berechneCredits(a), 0);
	const abrechnungBetrag = Math.max(0, buchung.preisCHF - creditsCHF);

	await updateRessourceBuchung(buchung.id, { creditsCHF, abrechnungBetrag });

	const { Resend } = await import('resend');
	await new Resend(resendKey).emails.send({
		from: emailFrom,
		to: toEmail,
		...checkoutBillingMail({
			...buchung,
			creditsCHF,
			abrechnungBetrag,
			aufgaben: erledigt.map((a) => ({ titel: a.aufgabeTitel, credits: berechneCredits(a) })),
			freigabeLink: freigabeUrl
		})
	});
}

// ── Actions ────────────────────────────────────────────────────────────────────

export const actions: Actions = {
	delete: async ({ request }) => {
		const id = (await request.formData()).get('id');
		if (typeof id === 'string' && id) await deleteRessourceBuchung(id);
	},

	// ── Vorwärts: pending → confirmed ─────────────────────────────────────────
	bestaetigen: async ({ request, fetch }) => {
		const id = (await request.formData()).get('id') as string;
		if (!id) return;
		const buchung = await updateRessourceBuchungStatus(id, 'confirmed');
		await mailBestaetigung(buchung, fetch).catch(console.error);
		await maybeSendAnkunftsErinnerung(buchung, fetch).catch(console.error);
	},

	// ── Vorwärts: confirmed → checked_in ──────────────────────────────────────
	checkin: async ({ request }) => {
		const id = (await request.formData()).get('id') as string;
		if (!id) return;
		const buchung = await updateRessourceBuchung(id, {
			status: 'checked_in',
			checkedInAt: new Date().toISOString()
		});
		const toEmail = await getNotifyTo();
		await mailCheckIn(buchung, toEmail).catch(console.error);
	},

	// ── Vorwärts: checked_in → checked_out ────────────────────────────────────
	checkout: async ({ request, url }) => {
		const id = (await request.formData()).get('id') as string;
		if (!id) return;
		const buchung = await updateRessourceBuchung(id, {
			status: 'checked_out',
			checkOutAt: new Date().toISOString()
		});
		const toEmail = await getNotifyTo();
		const origin = url.origin;
		const freigabeUrl = `${origin}/api/freigabe-abrechnung?id=${encodeURIComponent(id)}&token=${adminActionToken('freigabe-abrechnung', id)}`;
		await mailAbrechnung(buchung, toEmail, freigabeUrl).catch(console.error);
	},

	// ── Rückwärts: einen Schritt zurück (kein Mail) ───────────────────────────
	zurueck: async ({ request }) => {
		const id = (await request.formData()).get('id') as string;
		if (!id) return;
		const buchung = await getRessourceBuchung(id);
		if (!buchung) return;
		const prev: Record<string, RessourceBuchung['status']> = {
			confirmed: 'pending',
			checked_in: 'confirmed',
			checked_out: 'checked_in',
			abgerechnet: 'checked_out'
		};
		const target = prev[buchung.status];
		if (!target) return;
		// Zurück auf pending: Reminder-Flags zurücksetzen damit sie bei erneuter Bestätigung neu greifen
		if (target === 'pending') {
			await updateRessourceBuchung(id, {
				status: 'pending',
				reminderSent: false,
				nachAnkunftReminderSent: false,
				abreiseReminderSent: false
			});
		} else {
			await updateRessourceBuchungStatus(id, target);
		}
	},

	// ── Vorwärts ohne Mail: einen Schritt weiter (kein Mail) ────────────────────
	voraus: async ({ request }) => {
		const id = (await request.formData()).get('id') as string;
		if (!id) return;
		const buchung = await getRessourceBuchung(id);
		if (!buchung) return;
		const next: Record<string, RessourceBuchung['status']> = {
			pending: 'confirmed',
			confirmed: 'checked_in',
			checked_in: 'checked_out',
			checked_out: 'abgerechnet'
		};
		const target = next[buchung.status];
		if (!target) return;
		await updateRessourceBuchungStatus(id, target);
	},

	// ── Ankunfts-Reminder manuell senden (Admin) ────────────────────────────
	sendReminder: async ({ request, fetch }) => {
		const id = (await request.formData()).get('id') as string;
		if (!id) return;
		const buchung = await getRessourceBuchung(id);
		if (!buchung) return;
		await maybeSendAnkunftsErinnerung(buchung, fetch, true);
	},

	// ── Abreise-Reminder manuell senden (Admin) ─────────────────────────────
	sendAbreiseReminder: async ({ request, fetch }) => {
		const id = (await request.formData()).get('id') as string;
		if (!id) return;
		const buchung = await getRessourceBuchung(id);
		if (!buchung) return;
		await sendAbreiseErinnerung(buchung, fetch, true);
	},

	deleteAll: async () => {
		const all = await listAlleRessourceBuchungen();
		await Promise.all(all.map((b) => deleteRessourceBuchung(b.id)));
		return { ok: true };
	},

	create: async ({ request, fetch }) => {
		const fd = await request.formData();
		const ressourceUid = (fd.get('ressourceUid') as string)?.trim();
		const von = fd.get('von') as string;
		const bis = fd.get('bis') as string;
		const personen = Number(fd.get('personen') ?? 1);
		const name = (fd.get('name') as string)?.trim();
		const email = (fd.get('email') as string)?.trim();
		const telefon = (fd.get('telefon') as string)?.trim();
		const nachricht = (fd.get('nachricht') as string)?.trim();
		const preisCHF = Number(fd.get('preisCHF') ?? 0);
		const status = (fd.get('status') as RessourceBuchung['status']) ?? 'confirmed';

		if (!ressourceUid || !von || !bis || !name || !email) return { error: 'Pflichtfelder fehlen' };

		let ressourceName = ressourceUid;
		try {
			const client = createClient({ fetch });
			const doc = await client.getByUID('ressource', ressourceUid);
			ressourceName = (doc.data as any).name ?? ressourceUid;
		} catch {
			/* Prismic nicht erreichbar – UID als Name nutzen */
		}

		const { bucheRessource } = await import('$lib/server/ressourceBuchungen');
		await bucheRessource({
			ressourceUid,
			ressourceName,
			von,
			bis,
			personen,
			zimmerauswahl: [],
			preisCHF,
			bookedAt: new Date().toISOString(),
			status,
			name,
			email,
			telefon,
			nachricht
		});
	}
};
