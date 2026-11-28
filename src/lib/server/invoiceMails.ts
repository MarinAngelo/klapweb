/**
 * Texts of the invoice e-mails (admin, checkout «gegen Rechnung», recurring invoices, dunning).
 *
 * Pure builders, used by the senders and by the preview /admin/rechnungen/e-mails — so the
 * preview always shows exactly what is sent. `style` = settings «Anrede» / «Begrüssung in
 * Standardtexten» (getTextStyle()); customer mails with `theme` get an HTML part in the page colours.
 */
import { closingLine, duSie, greetingLine, wirIch, type TextStyle } from '$lib/addressForm';
import { applyTokens, richTextToMail, withHtml, type Mail } from '$lib/server/mailText';
import type { MailTheme } from '$lib/mailLayout.js';

type Base = {
	name?: string;
	companyName: string;
	style?: TextStyle;
	/** Page colours of the active theme (loadMailTheme) → HTML part */
	theme?: MailTheme | null;
};

const subjectWith = (style: TextStyle | undefined, invoiceNumber: string, companyName: string) =>
	`${duSie(style?.du, 'Ihre', 'Deine')} Rechnung ${invoiceNumber}${companyName ? ` – ${companyName}` : ''}`;

/** Invoice created or sent in the admin (/admin/rechnungen) */
export function adminInvoiceMail(c: Base & { invoiceNumber: string }): Mail {
	return withHtml(
		{
			subject: subjectWith(c.style, c.invoiceNumber, c.companyName),
			text: [
				greetingLine(c.style, c.name),
				'',
				duSie(
					c.style?.du,
					'Vielen Dank für Ihren Auftrag. Bitte finden Sie Ihre Rechnung im Anhang.',
					'Vielen Dank für deinen Auftrag. Deine Rechnung findest du im Anhang.'
				),
				'',
				closingLine(c.style),
				c.companyName
			].join('\n')
		},
		c.theme
	);
}

/** Settings «Betreff» / «Text» of the checkout e-mail (with {{tokens}}) */
export type MailTemplate = { subject: string | null; body: Array<{ text?: string }> | null };

/** Order «gegen Rechnung» (checkout) to the customer: own template from the settings or standard */
export function checkoutInvoiceMail(
	c: Base & { invoiceNumber: string; template: MailTemplate; tokens: Record<string, string> }
): Mail {
	return withHtml(
		{
			subject: c.template.subject
				? applyTokens(c.template.subject, c.tokens)
				: subjectWith(c.style, c.invoiceNumber, c.companyName),
			text:
				richTextToMail(c.template.body, c.tokens) ||
				[
					greetingLine(c.style, c.name),
					'',
					duSie(
						c.style?.du,
						'Vielen Dank für Ihre Bestellung. Bitte finden Sie Ihre Rechnung im Anhang.',
						'Vielen Dank für deine Bestellung. Deine Rechnung findest du im Anhang.'
					),
					'',
					closingLine(c.style),
					c.companyName
				].join('\n')
		},
		c.theme
	);
}

/** Order «gegen Rechnung» (checkout) to the business */
export function checkoutBusinessMail(c: {
	invoiceNumber: string;
	customerName: string;
	customerEmail: string;
	service: string;
	/** «Label: Wert» of all form fields */
	fieldLines: string[];
}): Mail {
	return {
		subject: `Neue Bestellung gegen Rechnung: ${c.invoiceNumber}`,
		text: `Neue Bestellung eingegangen.\n\nRechnungsnummer: ${c.invoiceNumber}\nKunde: ${c.customerName} <${c.customerEmail}>\nDienstleistung: ${c.service}\n\nAlle Angaben:\n${c.fieldLines.join('\n')}`
	};
}

/** Yearly invoice created from a recurring template, to the customer */
export function recurringInvoiceMail(c: Base & { invoiceNumber: string }): Mail {
	return withHtml(
		{
			subject: subjectWith(c.style, c.invoiceNumber, c.companyName),
			text: [
				greetingLine(c.style, c.name),
				'',
				duSie(
					c.style?.du,
					`Im Anhang erhalten Sie die jährliche Rechnung ${c.invoiceNumber}.`,
					`Im Anhang erhältst du die jährliche Rechnung ${c.invoiceNumber}.`
				),
				'',
				closingLine(c.style),
				c.companyName
			].join('\n')
		},
		c.theme
	);
}

/** Info to the operator about a created recurring invoice */
export function recurringOperatorMail(c: {
	invoiceNumber: string;
	templateNumber: string;
	name: string;
	sentTo: string | null;
	nextDate: string;
}): Mail {
	return {
		subject: `Wiederkehrende Rechnung ${c.invoiceNumber} – ${c.name}`,
		text: [
			`Die jährliche Rechnung ${c.invoiceNumber} wurde erstellt (Vorlage ${c.templateNumber}).`,
			c.sentTo
				? `Sie wurde an ${c.sentTo} gesendet.`
				: 'Sie wurde NICHT gemailt (keine E-Mail-Adresse oder Versand fehlgeschlagen) – bitte im Admin unter «Rechnungen» versenden.',
			`Nächste Rechnung: ${c.nextDate}`
		].join('\n\n')
	};
}

/** Payment reminder (level 1 or 2) with the invoice PDF */
export function dunningMail(
	c: Base & {
		level: number;
		invoiceNumber: string;
		/** «12.11.2026» */
		invoiceDate: string;
		amount: string;
		dueDate: string;
	}
): Mail {
	return withHtml(
		{
			subject: `${c.level}. Mahnung: Rechnung ${c.invoiceNumber} – ${c.companyName}`,
			text: [
				greetingLine(c.style, c.name),
				'',
				`${wirIch(c.style?.ich, 'Unsere', 'Meine')} Rechnung ${c.invoiceNumber} vom ${c.invoiceDate} über ${c.amount} ist noch offen.`,
				duSie(
					c.style?.du,
					`Bitte begleichen Sie den Betrag bis ${c.dueDate}. Die Rechnung mit Einzahlungsschein liegt bei.`,
					`Bitte begleiche den Betrag bis ${c.dueDate}. Die Rechnung mit Einzahlungsschein liegt bei.`
				),
				'',
				duSie(
					c.style?.du,
					'Falls Sie die Zahlung bereits ausgelöst haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.',
					'Falls du die Zahlung bereits ausgelöst hast, betrachte dieses Schreiben bitte als gegenstandslos.'
				),
				'',
				closingLine(c.style),
				c.companyName
			].join('\n')
		},
		c.theme
	);
}

/** Daily summary of the dunning run to the operator */
export function dunningOperatorMail(notes: string[]): Mail {
	return {
		subject: `Mahnwesen: ${notes.length} Rechnung${notes.length === 1 ? '' : 'en'}`,
		text: notes.join('\n\n')
	};
}
