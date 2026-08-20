import type { PageServerLoad, Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
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
import { maybeSendAnkunftsErinnerung } from '$lib/server/reminderMail';
import { env } from '$env/dynamic/private';

function replaceTokens(html: string, tokens: Record<string, string>): string {
	return html.replace(/\{\{([^}]+)\}\}/g, (_, key) => tokens[key] ?? '');
}

export const prerender = false;

function fmt(chf: number) {
	return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(chf);
}
function fmtD(iso: string) {
	const [y, m, d] = iso.split('-');
	return `${d}.${m}.${y}`;
}

function checkAuth(url: URL) {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('secret');
	if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
}

export const load: PageServerLoad = async ({ url }) => {
	checkAuth(url);

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
	const emailFrom = env.INVOICE_FROM_EMAIL;
	if (!resendKey || !emailFrom || !buchung.email) return;

	const naechte = Math.round(
		(new Date(buchung.bis).getTime() - new Date(buchung.von).getTime()) / 86400000
	);

	const vonFormatted = formatDateWithWeekday(buchung.von, null, 'de-CH', 'long');
	const bisFormatted = formatDateWithWeekday(buchung.bis, null, 'de-CH', 'long');

	const zimmerauswahl = buchung.zimmerauswahl ?? [];
	const zimmerHtml = zimmerauswahl.length
		? `<ul>${zimmerauswahl.map((z) => `<li>${z.zimmer_name || z.bett_typ} (${z.anzahl_betten}× ${z.bett_typ})</li>`).join('')}</ul>`
		: 'Ganze Wohnung';

	const tokenMap: Record<string, string> = {
		Name: buchung.name ?? '',
		Ressource: buchung.ressourceName ?? buchung.ressourceUid,
		RessourceUid: buchung.ressourceUid,
		Anreise: vonFormatted,
		Abreise: bisFormatted,
		Nächte: String(naechte),
		Personen: String(buchung.personen),
		Zimmer: zimmerHtml,
		Total: fmt(buchung.preisCHF),
		Buchungsreferenz: buchung.referenz ?? buchung.id
	};

	let betreff = `Buchungsbestätigung: ${buchung.ressourceName ?? buchung.ressourceUid}`;
	let mailHtml: string | null = null;

	try {
		const client = createClient({ fetch });
		const doc = await client.getByUID('ressource', buchung.ressourceUid);
		const d = doc.data as any;

		const cmsBetreff = (d.buchungsbestaetigung_betreff as string)?.trim();
		if (cmsBetreff) betreff = replaceTokens(cmsBetreff, tokenMap);

		const cmsTextField = d.buchungsbestaetigung_text as prismic.RichTextField | undefined;
		if (cmsTextField?.length) {
			mailHtml = replaceTokens(prismic.asHTML(cmsTextField) ?? '', tokenMap);
		}
	} catch {
		// Prismic unavailable — use fallback
	}

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
		const zimmerZeilen = zimmerauswahl.map(
			(z) => `           · ${z.zimmer_name || z.bett_typ} (${z.anzahl_betten}× ${z.bett_typ})`
		);
		const { error: e } = await resend.emails.send({
			from: emailFrom,
			to: buchung.email,
			subject: betreff,
			text: [
				`Guten Tag ${buchung.name}`,
				``,
				`Ihre Buchungsanfrage wurde bestätigt.`,
				``,
				`Ressource: ${buchung.ressourceName ?? buchung.ressourceUid}`,
				`Anreise:   ${vonFormatted}`,
				`Abreise:   ${bisFormatted}`,
				`Nächte:    ${naechte}`,
				`Personen:  ${buchung.personen}`,
				...(zimmerZeilen.length ? [`Zimmer:`, ...zimmerZeilen] : [`Zimmer:    Ganze Wohnung`]),
				`Total:     ${fmt(buchung.preisCHF)}`,
				``,
				`Ihre Buchungsreferenz: ${buchung.referenz ?? buchung.id}`,
				`(Diese benötigen Sie für den Check-in und Check-out auf unserer Website.)`,
				``,
				`Wir melden uns in Kürze zur Zahlungsabwicklung.`,
				``,
				`Freundliche Grüsse`
			].join('\n')
		});
		if (e) console.error('Bestätigungsmail fehlgeschlagen:', e);
	}
}

async function mailCheckIn(buchung: RessourceBuchung, toEmail: string) {
	const resendKey = env.RESEND_API_KEY;
	const emailFrom = env.INVOICE_FROM_EMAIL;
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
	const emailFrom = env.INVOICE_FROM_EMAIL;
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
		text: [
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
	});
}

// ── Actions ────────────────────────────────────────────────────────────────────

export const actions: Actions = {
	delete: async ({ request, url }) => {
		checkAuth(url);
		const id = (await request.formData()).get('id');
		if (typeof id === 'string' && id) await deleteRessourceBuchung(id);
	},

	// ── Vorwärts: pending → confirmed ─────────────────────────────────────────
	bestaetigen: async ({ request, url, fetch }) => {
		checkAuth(url);
		const id = (await request.formData()).get('id') as string;
		if (!id) return;
		const buchung = await updateRessourceBuchungStatus(id, 'confirmed');
		await mailBestaetigung(buchung, fetch).catch(console.error);
		await maybeSendAnkunftsErinnerung(buchung, fetch).catch(console.error);
	},

	// ── Vorwärts: confirmed → checked_in ──────────────────────────────────────
	checkin: async ({ request, url }) => {
		checkAuth(url);
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
		checkAuth(url);
		const id = (await request.formData()).get('id') as string;
		if (!id) return;
		const buchung = await updateRessourceBuchung(id, {
			status: 'checked_out',
			checkOutAt: new Date().toISOString()
		});
		const toEmail = env.INVOICE_TO_EMAIL || '';
		const adminSecret = env.ADMIN_SECRET ?? '';
		const origin = url.origin;
		const freigabeUrl = `${origin}/api/freigabe-abrechnung?id=${encodeURIComponent(id)}&secret=${adminSecret}`;
		await mailAbrechnung(buchung, toEmail, freigabeUrl).catch(console.error);
	},

	// ── Rückwärts: einen Schritt zurück (kein Mail) ───────────────────────────
	zurueck: async ({ request, url }) => {
		checkAuth(url);
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
				nachAnkunftReminderSent: false
			});
		} else {
			await updateRessourceBuchungStatus(id, target);
		}
	},

	deleteAll: async ({ url }) => {
		const secret = env.ADMIN_SECRET;
		const provided = url.searchParams.get('secret');
		if (!secret || provided !== secret) throw error(403, 'Kein Zugriff');
		const all = await listAlleRessourceBuchungen();
		await Promise.all(all.map((b) => deleteRessourceBuchung(b.id)));
		return { ok: true };
	},

	create: async ({ request, url, fetch }) => {
		checkAuth(url);
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
