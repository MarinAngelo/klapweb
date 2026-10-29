import type { PageServerLoad, Actions } from './$types';
import { loadMailTheme, wrapMail } from '$lib/mailLayout.js';
import {
	loadVariablesData,
	mailVariables,
	renderMailHtml,
	renderMailText
} from '$lib/variables.js';
import { plainTextMail } from '$lib/server/mailText';
import { formatDateWithWeekday } from '$lib/utils/formatDate';
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
import * as prismic from '@prismicio/client';
import { maybeSendAnkunftsErinnerung, sendAbreiseErinnerung } from '$lib/server/reminderMail';
import { env } from '$env/dynamic/private';
import { adminActionToken } from '$lib/server/adminAuth';
import {
	bestaetigungFallbackText,
	bestaetigungTokens,
	fallbackSubject,
	getRessourceDocForBooking
} from '$lib/server/ressourceMail';

export const prerender = false;

function fmt(chf: number) {
	return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(chf);
}
function fmtD(iso: string) {
	const [y, m, d] = iso.split('-');
	return `${d}.${m}.${y}`;
}

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
	const emailFrom = env.EMAIL_FROM_ADDRESS;
	if (!resendKey || !emailFrom || !buchung.email) return;

	// CMS template in the booking language (fallback: main language)
	let ressourceName: string | undefined;
	let cmsBetreff = '';
	// Page colours (active theme) for the mail layout
	let mailTheme: Awaited<ReturnType<typeof loadMailTheme>> | null = null;
	// Variablen (incl. multi-line text) in the booking language, replaced before the booking tokens
	let vars: ReturnType<typeof mailVariables> = {};
	let cmsTextField: prismic.RichTextField | undefined;
	try {
		const client = createClient({ fetch });
		const [doc, variablesData, theme] = await Promise.all([
			getRessourceDocForBooking(client, buchung),
			loadVariablesData(client),
			loadMailTheme(client, buchung.lang)
		]);
		mailTheme = theme;
		vars = mailVariables(variablesData, buchung.lang);
		const d = doc.data as any;
		ressourceName = d.name;
		cmsBetreff = (d.buchungsbestaetigung_betreff as string)?.trim() ?? '';
		cmsTextField = d.buchungsbestaetigung_text as prismic.RichTextField | undefined;
	} catch {
		// Prismic unavailable — use fallback
	}

	const tokenMap = bestaetigungTokens(buchung, ressourceName);
	const betreff = cmsBetreff
		? renderMailText(cmsBetreff, tokenMap, vars)
		: fallbackSubject('Buchungsbestätigung: {ressource}', buchung, ressourceName);
	const mailHtml = cmsTextField?.length
		? wrapMail(renderMailHtml(cmsTextField ?? [], tokenMap, vars, mailTheme), mailTheme, {
				lang: buchung.lang,
				subject: betreff
			})
		: null;

	const { Resend } = await import('resend');
	const resend = new Resend(resendKey);

	if (mailHtml) {
		const { error: e } = await resend.emails.send({
			from: emailFrom,
			to: buchung.email,
			subject: betreff,
			html: mailHtml
		});
		if (e) console.error('Bestätigungsmail fehlgeschlagen:', e);
	} else {
		const { error: e } = await resend.emails.send({
			from: emailFrom,
			to: buchung.email,
			subject: betreff,
			text: bestaetigungFallbackText(buchung, tokenMap)
		});
		if (e) console.error('Bestätigungsmail fehlgeschlagen:', e);
	}
}

async function mailCheckIn(buchung: RessourceBuchung, toEmail: string) {
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.EMAIL_FROM_ADDRESS;
	if (!resendKey || !emailFrom || !toEmail) return;

	const { Resend } = await import('resend');
	await new Resend(resendKey).emails.send({
		from: emailFrom,
		to: toEmail,
		subject: `Check-in: ${buchung.ressourceName ?? buchung.ressourceUid}`,
		text: [
			`${buchung.name ?? '–'} hat eingecheckt.`,
			``,
			`Ressource: ${buchung.ressourceName ?? buchung.ressourceUid}`,
			`Anreise:   ${fmtD(buchung.von)}`,
			`Abreise:   ${fmtD(buchung.bis)}`,
			`Personen:  ${buchung.personen}`
		].join('\n')
	});
}

async function mailAbrechnung(buchung: RessourceBuchung, toEmail: string, freigabeUrl: string) {
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.EMAIL_FROM_ADDRESS;
	if (!resendKey || !emailFrom || !toEmail) return;

	const annahmen = await listAnnahmenFuerBuchung(buchung.id).catch(() => []);
	const erledigt = annahmen.filter((a) => a.status === 'erledigt');
	const creditsCHF = erledigt.reduce((s, a) => s + berechneCredits(a), 0);
	const abrechnungBetrag = Math.max(0, buchung.preisCHF - creditsCHF);

	await updateRessourceBuchung(buchung.id, { creditsCHF, abrechnungBetrag });

	const aufgabenZeilen = erledigt.length
		? erledigt.map((a) => `  · ${a.aufgabeTitel}: ${fmt(berechneCredits(a))}`)
		: ['  (keine)'];

	const { Resend } = await import('resend');
	await new Resend(resendKey).emails.send({
		from: emailFrom,
		to: toEmail,
		subject: `Abrechnung freigeben: ${buchung.ressourceName ?? buchung.ressourceUid} – ${buchung.name ?? '–'}`,
		...plainTextMail(
			[
				`${buchung.name ?? '–'} hat ausgecheckt.`,
				``,
				`Ressource: ${buchung.ressourceName ?? buchung.ressourceUid}`,
				`Anreise:   ${fmtD(buchung.von)}`,
				`Abreise:   ${fmtD(buchung.bis)}`,
				`Personen:  ${buchung.personen}`,
				``,
				`─────────────────────────────────────`,
				`ABRECHNUNG`,
				`─────────────────────────────────────`,
				`Mietpreis:          ${fmt(buchung.preisCHF)}`,
				`Credits (Aufgaben): ${fmt(creditsCHF)}`,
				`─────────────────────────────────────`,
				`Total:              ${fmt(abrechnungBetrag)}`,
				``,
				`Erledigte Aufgaben:`,
				...aufgabenZeilen,
				``,
				`Abrechnung prüfen, korrigieren und freigeben:`,
				freigabeUrl
			].join('\n')
		)
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
		const toEmail = env.INVOICE_TO_EMAIL || '';
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
		const toEmail = env.INVOICE_TO_EMAIL || '';
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
