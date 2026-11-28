/**
 * Guest mails for resource bookings in the booking language (buchung.lang).
 * Template texts come from the translated Prismic document, token values are
 * formatted / translated here. Without translation the main language document is used.
 */
import type { Client } from '@prismicio/client';
import { t } from '$lib/i18n/translations';
import { formatDateWithWeekday } from '$lib/utils/formatDate';
import type { RessourceBuchung } from './ressourceBuchungen';
import type * as prismic from '@prismicio/client';
import { wrapMail, type MailTheme } from '$lib/mailLayout.js';
import { mailVariables, renderMailHtml, renderMailText } from '$lib/variables.js';
import { plainTextMail, styledText, type Mail } from '$lib/server/mailText';
import type { TextStyle } from '$lib/addressForm';

const LANG_RE = /^[a-z]{2}-[a-z]{2}$/;

/** Prismic locale from client input, null if invalid */
export function parseBookingLang(value: unknown): string | null {
	return typeof value === 'string' && LANG_RE.test(value) ? value : null;
}

/** Language for mail texts (fallback: German) */
export function mailLang(buchung: Pick<RessourceBuchung, 'lang'>): string {
	return buchung.lang || 'de-ch';
}

/** Intl locale for dates and amounts, e.g. 'en-us' → 'en-US' */
export function mailLocale(buchung: Pick<RessourceBuchung, 'lang'>): string {
	const [l, region] = mailLang(buchung).split('-');
	return `${l}-${region.toUpperCase()}`;
}

/** Resource document in the booking language, otherwise in the main language */
export async function getRessourceDocForBooking(
	client: Client,
	buchung: Pick<RessourceBuchung, 'ressourceUid' | 'lang'>
) {
	if (buchung.lang) {
		try {
			return await client.getByUID('ressource' as any, buchung.ressourceUid, {
				lang: buchung.lang
			});
		} catch {
			// no translation → main language
		}
	}
	return client.getByUID('ressource' as any, buchung.ressourceUid);
}

/** Tokens of the booking confirmation mail */
export function bestaetigungTokens(
	buchung: RessourceBuchung,
	ressourceName: string | undefined
): Record<string, string> {
	const lang = mailLang(buchung);
	const locale = mailLocale(buchung);
	const naechte = Math.round(
		(new Date(buchung.bis).getTime() - new Date(buchung.von).getTime()) / 86400000
	);
	const zimmerauswahl = buchung.zimmerauswahl ?? [];
	const zimmerHtml = zimmerauswahl.length
		? `<ul>${zimmerauswahl
				.map((z) => {
					const bett = t(z.bett_typ, lang);
					return `<li>${z.zimmer_label || z.zimmer_name || bett} (${z.anzahl_betten}× ${bett})</li>`;
				})
				.join('')}</ul>`
		: t('Ganze Wohnung', lang);

	return {
		Name: buchung.name ?? '',
		Ressource: ressourceName || buchung.ressourceName || buchung.ressourceUid,
		RessourceUid: buchung.ressourceUid,
		Anreise: formatDateWithWeekday(buchung.von, null, locale, 'long'),
		Abreise: formatDateWithWeekday(buchung.bis, null, locale, 'long'),
		Nächte: String(naechte),
		Personen: String(buchung.personen),
		Zimmer: zimmerHtml,
		Total: new Intl.NumberFormat(locale, { style: 'currency', currency: 'CHF' }).format(
			buchung.preisCHF
		),
		Buchungsreferenz: buchung.referenz ?? buchung.id
	};
}

/** Subject when the CMS field is empty, e.g. 'Buchungsbestätigung: {ressource}' */
export function fallbackSubject(
	key: string,
	buchung: RessourceBuchung,
	ressourceName?: string,
	style?: TextStyle
) {
	return styledText(mailLang(buchung), style)
		.t(key)
		.replace('{ressource}', ressourceName || buchung.ressourceName || buchung.ressourceUid);
}

/** Plain text confirmation when the CMS text is empty */
export function bestaetigungFallbackText(
	buchung: RessourceBuchung,
	tokens: Record<string, string>,
	style?: TextStyle
): string {
	const lang = mailLang(buchung);
	const st = styledText(lang, style);
	const label = (key: string) => `${t(key, lang)}:`.padEnd(11);
	const zimmerZeilen = (buchung.zimmerauswahl ?? []).map((z) => {
		const bett = t(z.bett_typ, lang);
		return `           · ${z.zimmer_label || z.zimmer_name || bett} (${z.anzahl_betten}× ${bett})`;
	});
	return [
		st.greeting(buchung.name),
		``,
		st.t('Ihre Buchungsanfrage wurde bestätigt.'),
		``,
		`${label('Ressource')}${tokens.Ressource}`,
		`${label('Anreise')}${tokens.Anreise}`,
		`${label('Abreise')}${tokens.Abreise}`,
		`${label('Nächte')}${tokens.Nächte}`,
		`${label('Personen')}${tokens.Personen}`,
		...(zimmerZeilen.length
			? [`${t('Zimmer', lang)}:`, ...zimmerZeilen]
			: [`${label('Zimmer')}${t('Ganze Wohnung', lang)}`]),
		`${label('Total')}${tokens.Total}`,
		``,
		`${st.t('Ihre Buchungsreferenz')}: ${tokens.Buchungsreferenz}`,
		st.t('(Diese benötigen Sie für den Check-in und Check-out auf unserer Website.)'),
		``,
		st.t('Wir melden uns in Kürze zur Zahlungsabwicklung.'),
		``,
		st.closing()
	].join('\n');
}

// ── Mail builders (senders + preview /admin/ressource-buchungen/e-mails) ─────────

const fmtChf = (chf: number) =>
	new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(chf);
/** «2026-11-26» → «26.11.2026» */
export const fmtDatum = (iso: string) => iso.split('-').reverse().join('.');

/** Mail with HTML part (CMS texts in the mail layout) */
type HtmlMail = Mail & { html: string };

/** CMS texts of the resource document (rich text with {{tokens}} and Variablen) */
export type CmsMailContext = {
	/** data of the resource document in the booking language, null = not available */
	doc: Record<string, any> | null;
	vars: ReturnType<typeof mailVariables>;
	theme: MailTheme | null;
	/** Settings Du/Sie, Wir/Ich, greeting, closing — for the standard texts (not the CMS texts) */
	style?: TextStyle;
};

/** New booking request to the operator, with the confirmation link */
export function requestProviderMail(
	b: Pick<
		RessourceBuchung,
		'ressourceUid' | 'von' | 'bis' | 'personen' | 'zimmerauswahl' | 'preisCHF' | 'name' | 'email'
	> & {
		ressourceName: string;
		telefon?: string;
		nachricht?: string;
		bestaetigungsLink: string;
	}
): Mail {
	const naechte = Math.round((new Date(b.bis).getTime() - new Date(b.von).getTime()) / 86400000);
	const zimmerZeilen = (b.zimmerauswahl ?? []).map(
		(z) => `           · ${z.zimmer_name || z.bett_typ} (${z.anzahl_betten}× ${z.bett_typ})`
	);
	return {
		subject: `Neue Buchungsanfrage: ${b.ressourceName}`,
		...plainTextMail(
			[
				`Neue Buchungsanfrage eingegangen.`,
				``,
				`Ressource: ${b.ressourceName} (${b.ressourceUid})`,
				`Anreise:   ${fmtDatum(b.von)}`,
				`Abreise:   ${fmtDatum(b.bis)}`,
				`Nächte:    ${naechte}`,
				`Personen:  ${b.personen}`,
				...(zimmerZeilen.length ? [`Zimmer:`, ...zimmerZeilen] : [`Zimmer:    Ganze Wohnung`]),
				`Total:     ${fmtChf(b.preisCHF)}`,
				``,
				`Kontakt:`,
				`Name:     ${b.name}`,
				`E-Mail:   ${b.email}`,
				...(b.telefon ? [`Telefon:  ${b.telefon}`] : []),
				...(b.nachricht ? [``, `Nachricht:`, b.nachricht] : []),
				``,
				`─────────────────────────────────────`,
				`Anfrage bestätigen (Mieter erhält dann die Bestätigungsmail):`,
				b.bestaetigungsLink
			].join('\n')
		)
	};
}

/** Booking confirmation to the guest: CMS text of the resource (HTML) or plain text fallback */
export function confirmationGuestMail(buchung: RessourceBuchung, cms: CmsMailContext): Mail {
	const d = cms.doc ?? {};
	const tokens = bestaetigungTokens(buchung, d.name);
	const cmsBetreff = (d.buchungsbestaetigung_betreff as string)?.trim() ?? '';
	const subject = cmsBetreff
		? renderMailText(cmsBetreff, tokens, cms.vars)
		: fallbackSubject('Buchungsbestätigung: {ressource}', buchung, d.name, cms.style);
	const field = d.buchungsbestaetigung_text as prismic.RichTextField | undefined;
	if (field?.length) {
		return {
			subject,
			text: '',
			html: wrapMail(renderMailHtml(field, tokens, cms.vars, cms.theme), cms.theme, {
				lang: buchung.lang,
				subject
			})
		};
	}
	return { subject, text: bestaetigungFallbackText(buchung, tokens, cms.style) };
}

/** Tokens of the reminder mails ({{Türcode}}, {{Messenger-Apps}} …) */
export function reminderTokens(
	buchung: RessourceBuchung,
	doorCode: string,
	messengerHtml: string
): Record<string, string> {
	return {
		Türcode: doorCode,
		Name: buchung.name || '',
		Anreise: fmtDatum(buchung.von),
		Abreise: fmtDatum(buchung.bis),
		Buchungsreferenz: buchung.referenz ?? buchung.id,
		'Messenger-Apps': messengerHtml,
		WhatsApp: messengerHtml
	};
}

/** Arrival reminder: CMS «Erinnerung» text of the resource, otherwise a short standard text */
export function arrivalReminderMail(
	buchung: RessourceBuchung,
	cms: CmsMailContext,
	tokens: Record<string, string>
): HtmlMail {
	const d = cms.doc ?? {};
	const subject =
		renderMailText((d.reminder_betreff as string)?.trim() ?? '', tokens, cms.vars) ||
		fallbackSubject('Ihre Anreise: {ressource}', buchung, d.name, cms.style);
	const field = d.reminder_text as prismic.RichTextField | undefined;
	let html: string;
	if (field?.length) {
		html = renderMailHtml(field, tokens, cms.vars, cms.theme);
	} else {
		const lang = mailLang(buchung);
		const st = styledText(lang, cms.style);
		const intro = st
			.t('wir freuen uns auf Ihre Anreise am {anreise} (Abreise: {abreise}).')
			.replace('{anreise}', `<strong>${tokens.Anreise}</strong>`)
			.replace('{abreise}', tokens.Abreise);
		html = `<p>${st.greeting(tokens.Name)},</p>
<p>${intro}</p>
${tokens.Türcode ? `<p><strong>${t('Türcode', lang)}:</strong> ${tokens.Türcode}</p>` : ''}
${tokens['Messenger-Apps'] ? `<p>${t('Bei Fragen', lang)}:</p>${tokens['Messenger-Apps']}` : ''}
<p>${t('Referenz', lang)}: ${tokens.Buchungsreferenz}</p>`;
	}
	return {
		subject,
		text: '',
		html: wrapMail(html, cms.theme, { lang: buchung.lang, subject })
	};
}

/**
 * Reminder from a CMS text only (departure, after arrival): null without text — then
 * nothing is sent. `fieldPrefix` = 'abreise' | 'nach_ankunft' (fields `<prefix>_text/_betreff`).
 */
export function cmsReminderMail(
	buchung: RessourceBuchung,
	cms: CmsMailContext,
	tokens: Record<string, string>,
	fieldPrefix: 'abreise' | 'nach_ankunft',
	fallbackKey: string
): HtmlMail | null {
	const d = cms.doc ?? {};
	const field = d[`${fieldPrefix}_text`] as prismic.RichTextField | undefined;
	if (!field?.length) return null;
	const subject =
		renderMailText((d[`${fieldPrefix}_betreff`] as string)?.trim() ?? '', tokens, cms.vars) ||
		fallbackSubject(fallbackKey, buchung, d.name, cms.style);
	return {
		subject,
		text: '',
		html: wrapMail(renderMailHtml(field, tokens, cms.vars, cms.theme), cms.theme, {
			lang: buchung.lang,
			subject
		})
	};
}

type Stay = Pick<
	RessourceBuchung,
	'ressourceUid' | 'ressourceName' | 'name' | 'von' | 'bis' | 'personen'
>;
const stayLines = (b: Stay) => [
	`Ressource: ${b.ressourceName ?? b.ressourceUid}`,
	`Anreise:   ${fmtDatum(b.von)}`,
	`Abreise:   ${fmtDatum(b.bis)}`,
	`Personen:  ${b.personen}`
];
const checklistLines = (items?: string[], kommentar?: string) => [
	...(items?.length ? [``, `Checkliste:`, ...items.map((i) => `  ${i}`)] : []),
	...(kommentar ? [``, `Kommentar:`, kommentar] : [])
];

/** Check-in notice to the operator */
export function checkInMail(b: Stay & { items?: string[]; kommentar?: string }): Mail {
	return {
		subject: `Check-in: ${b.ressourceName ?? b.ressourceUid}`,
		text: [
			`${b.name ?? '–'} hat eingecheckt.`,
			``,
			...stayLines(b),
			...checklistLines(b.items, b.kommentar)
		].join('\n')
	};
}

/** Check-out: billing proposal with approval link to the operator */
export function checkoutBillingMail(
	b: Stay & {
		items?: string[];
		kommentar?: string;
		preisCHF: number;
		creditsCHF: number;
		abrechnungBetrag: number;
		/** Completed tasks: title + credits */
		aufgaben: { titel: string; credits: number }[];
		freigabeLink: string;
	}
): Mail {
	return {
		subject: `Abrechnung freigeben: ${b.ressourceName ?? b.ressourceUid} – ${b.name ?? '–'}`,
		...plainTextMail(
			[
				`${b.name ?? '–'} hat ausgecheckt.`,
				``,
				...stayLines(b),
				...checklistLines(b.items, b.kommentar),
				``,
				`─────────────────────────────────────`,
				`ABRECHNUNG`,
				`─────────────────────────────────────`,
				`Mietpreis:          ${fmtChf(b.preisCHF)}`,
				`Credits (Aufgaben): ${fmtChf(b.creditsCHF)}`,
				`─────────────────────────────────────`,
				`Total:              ${fmtChf(b.abrechnungBetrag)}`,
				``,
				`Erledigte Aufgaben:`,
				...(b.aufgaben.length
					? b.aufgaben.map((a) => `  · ${a.titel}: ${fmtChf(a.credits)}`)
					: ['  (keine)']),
				``,
				`Abrechnung prüfen, korrigieren und freigeben:`,
				b.freigabeLink
			].join('\n')
		)
	};
}

/** Final billing to the guest (after the operator's approval), in the booking language */
export function finalBillingMail(
	b: Pick<
		RessourceBuchung,
		| 'ressourceUid'
		| 'ressourceName'
		| 'name'
		| 'von'
		| 'bis'
		| 'referenz'
		| 'id'
		| 'preisCHF'
		| 'lang'
	> & {
		creditsCHF: number;
		aufgaben: { titel: string; credits: number }[];
		betrag: number;
		betragEur: number | null;
		eurRate: number | null;
		style?: TextStyle;
	}
): Mail {
	const lang = mailLang(b);
	const st = styledText(lang, b.style);
	const locale = mailLocale(b);
	const chf = (n: number) =>
		new Intl.NumberFormat(locale, { style: 'currency', currency: 'CHF' }).format(n);
	const eur = (n: number) =>
		new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(n);
	const label = (key: string, width = 20) => {
		const text = `${t(key, lang)}:`;
		return text.length >= width ? `${text} ` : text.padEnd(width);
	};
	const ressource = b.ressourceName ?? b.ressourceUid;
	const line = '─────────────────────────────────────';
	return {
		subject: st.t('Ihre Abrechnung: {ressource}').replace('{ressource}', ressource),
		text: [
			st.greeting(b.name),
			``,
			st.t('Vielen Dank für Ihren Aufenthalt. Hier ist Ihre definitive Abrechnung:'),
			``,
			`${label('Ressource', 11)}${ressource}`,
			`${label('Anreise', 11)}${fmtDatum(b.von)}`,
			`${label('Abreise', 11)}${fmtDatum(b.bis)}`,
			`${label('Buchungs-Nr.', 11)}${b.referenz ?? b.id}`,
			``,
			line,
			`${label('Mietpreis')}${chf(b.preisCHF)}`,
			...(b.creditsCHF > 0
				? [
						`${label('Credits (Aufgaben)')}− ${chf(b.creditsCHF)}`,
						``,
						`${t('Erledigte Aufgaben', lang)}:`,
						b.aufgaben.length
							? b.aufgaben.map((a) => `  · ${a.titel}: − ${chf(a.credits)}`).join('\n')
							: `  ${t('(keine)', lang)}`
					]
				: []),
			line,
			`${label('Total')}${chf(b.betrag)}`,
			...(b.betragEur !== null && b.eurRate
				? [
						`${label('Entspricht ca.')}${eur(b.betragEur)}`,
						`(${t('Tageskurs', lang)}: 1 CHF = ${b.eurRate.toFixed(4)} EUR)`
					]
				: []),
			line,
			``,
			st.closing()
		].join('\n')
	};
}
