/**
 * Texts of the e-mails of the tasks (Aufgaben, feature `ressourcenbuchung`): guests take on
 * tasks during their stay and get credits.
 *
 * Pure builders, used by the senders (api/aufgabe-annehmen, api/freigabe-aufgabe,
 * api/aufgabe-abgeben, admin/aufgaben) and by the preview /admin/aufgaben/e-mails.
 * Guest mails: form of address + greeting from the settings (`style`), HTML in the page colours
 * (`theme`); operator mails: plain text.
 */
import { duSie, greetingLine, type TextStyle } from '$lib/addressForm';
import type { MailTheme } from '$lib/mailLayout.js';
import { plainTextMail, withHtml, type Mail } from '$lib/server/mailText';

const chf = (n: number) =>
	new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(n);

type Guest = { name?: string; style?: TextStyle; theme?: MailTheme | null };

/** A guest took on a task → operator approves it via link */
export function taskAcceptedOperatorMail(c: {
	titel: string;
	name: string;
	email: string;
	buchungId: string;
	freigabeLink: string;
}): Mail {
	return {
		subject: `Aufgabe angenommen: ${c.titel}`,
		...plainTextMail(
			[
				`Eine Aufgabe wurde angenommen und wartet auf Ihre Freigabe.`,
				``,
				`Aufgabe: ${c.titel}`,
				`Name:    ${c.name}`,
				`E-Mail:  ${c.email}`,
				`Buchung: ${c.buchungId}`,
				``,
				`─────────────────────────────────────`,
				`Annahme freigeben (Nutzer erhält dann die Bestätigungsmail):`,
				c.freigabeLink
			].join('\n')
		)
	};
}

/** Operator confirmed the task → guest may do it */
export function taskConfirmedMail(
	c: Guest & {
		titel: string;
		creditTyp?: string;
		creditBetrag?: number;
		buchungId: string;
	}
): Mail {
	return withHtml(
		{
			subject: `Aufgabe bestätigt: ${c.titel}`,
			text: [
				greetingLine(c.style, c.name),
				``,
				`${duSie(c.style?.du, 'Ihre', 'Deine')} Aufgabe wurde vom Betreiber bestätigt und kann nun erledigt werden.`,
				``,
				`Aufgabe: ${c.titel}`,
				`Credits: ${c.creditTyp === 'fest' ? `${c.creditBetrag ?? 0} Credits (Fest)` : 'Zeitbasiert (Minuten × Preis/Nacht)'}`,
				``,
				duSie(
					c.style?.du,
					'Bitte melden Sie sich nach Erledigung auf unserer Website an und geben Sie die Aufgabe ab.',
					'Bitte melde dich nach Erledigung auf unserer Website an und gib die Aufgabe ab.'
				),
				`Buchungs-ID: ${c.buchungId}`,
				``,
				`Freundliche Grüsse`
			].join('\n')
		},
		c.theme
	);
}

/** Summary lines of a submitted task (guest and operator mail) */
export function taskSubmittedLines(c: {
	titel: string;
	minuten?: number | null;
	kommentar?: string;
	credits: number;
	buchungspreis: number | null;
}): string[] {
	return [
		`Aufgabe:        ${c.titel}`,
		...(c.minuten ? [`Geleistete Zeit: ${c.minuten} Minuten`] : []),
		...(c.kommentar ? [`Kommentar:      ${c.kommentar}`] : []),
		`Credits:        ${chf(c.credits)}`,
		...(c.buchungspreis != null
			? [
					``,
					`Buchungspreis:  ${chf(c.buchungspreis)}`,
					`Abzug Credits:  ${chf(c.credits)}`,
					`Restbetrag:     ${chf(Math.max(0, c.buchungspreis - c.credits))}`
				]
			: [])
	];
}

/** Guest submitted a done task → receipt to the guest */
export function taskSubmittedMail(c: Guest & { titel: string; lines: string[] }): Mail {
	return withHtml(
		{
			subject: `Abrechnung: ${c.titel}`,
			text: [
				greetingLine(c.style, c.name),
				``,
				`Vielen Dank – ${duSie(c.style?.du, 'Ihre', 'deine')} Aufgabe wurde erfasst und wird vom Betreiber geprüft.`,
				``,
				...c.lines,
				``,
				`Freundliche Grüsse`
			].join('\n')
		},
		c.theme
	);
}

/** Guest submitted a done task → operator checks it */
export function taskSubmittedOperatorMail(c: {
	titel: string;
	name: string;
	email?: string;
	buchungId: string;
	lines: string[];
}): Mail {
	return {
		subject: `Aufgabe abgegeben: ${c.titel}`,
		text: [
			`Eine Aufgabe wurde abgegeben und wartet auf Prüfung.`,
			``,
			`Name:    ${c.name}`,
			`E-Mail:  ${c.email}`,
			`Buchung: ${c.buchungId}`,
			``,
			...c.lines
		].join('\n')
	};
}

/** Operator approved the done task (credits final) → guest */
export function taskApprovedMail(
	c: Guest & {
		titel: string;
		creditTyp?: string;
		minuten?: number | null;
		kommentar?: string;
		baseCredits: number;
		adjustment: number;
		finalCredits: number;
		buchungspreis: number | null;
		betreiberAntwort?: string;
	}
): Mail {
	const lines = [
		`Aufgabe:             ${c.titel}`,
		`Credit-Typ:          ${c.creditTyp === 'offen' ? 'Zeitbasiert' : 'Fest'}`,
		...(c.minuten ? [`Geleistete Zeit:     ${c.minuten} Minuten`] : []),
		...(c.kommentar
			? [
					`${duSie(c.style?.du, 'Ihr', 'Dein')} Kommentar:${c.style?.du ? '      ' : '       '}${c.kommentar}`
				]
			: []),
		``,
		`Berechnete Credits:  ${chf(c.baseCredits)}`,
		...(c.adjustment !== 0
			? [`Anpassung:           ${c.adjustment > 0 ? '+' : ''}${chf(c.adjustment)}`]
			: []),
		`Credits total:       ${chf(c.finalCredits)}`,
		...(c.buchungspreis != null
			? [
					``,
					`Buchungspreis:       ${chf(c.buchungspreis)}`,
					`Abzug Credits:       ${chf(c.finalCredits)}`,
					`Restbetrag:          ${chf(Math.max(0, c.buchungspreis - c.finalCredits))}`
				]
			: [])
	];
	return withHtml(
		{
			subject: `Aufgabe freigegeben: ${c.titel}`,
			text: [
				greetingLine(c.style, c.name),
				``,
				`${duSie(c.style?.du, 'Ihre', 'Deine')} Aufgabe wurde vom Betreiber geprüft und freigegeben.`,
				``,
				...lines,
				...(c.betreiberAntwort
					? [``, `─────────────────────────────`, `Antwort des Betreibers:`, c.betreiberAntwort]
					: []),
				``,
				`Freundliche Grüsse`
			].join('\n')
		},
		c.theme
	);
}
