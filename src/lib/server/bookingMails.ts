/**
 * Texts of all e-mails of the appointment booking (feature `terminbuchung`).
 *
 * Pure builders, used by the senders (api/buche-termin, bookingCancel, bookingInvoices)
 * and by the preview in the admin (/admin/buchungen/e-mails) — so the preview always shows
 * exactly what is sent. `style` = settings «Anrede» / «Begrüssung in Standardtexten» (getTextStyle()).
 */

import { duSie, greetingLine, type TextStyle } from '$lib/addressForm';
import { applyTokens, richTextToMail, withHtml, type Mail } from '$lib/server/mailText';
import { mailButton, textToMailHtml, wrapMail, type MailTheme } from '$lib/mailLayout.js';

export type ConfirmationInput = {
	titel: string;
	/** «Montag, 9. November 2026» (empty = no date) */
	datumLabel: string;
	uhrzeit: string;
	sessionLaenge: number | null;
	name?: string;
	companyName: string;
	ortName: string;
	ortAdresse: string;
	ortWegbeschreibung: string;
	ortTelefon: string;
	ortKarte: string;
	/** «Kostenlos stornierbar bis …» ('' = no deadline) */
	stornoFrist: string;
	cancelFeePercent: number | null;
	offerPrice: number | null;
	/** Settings «Betreff» / «Text» of the confirmation (with {{tokens}}) */
	customSubject: string | null;
	customBody: Array<{ text?: string }> | null;
	/** Appointment converted to the customer's time zone ('' = same zone) */
	customerTimezone?: string;
	convertedTime?: string;
	icsLink: string;
	stornoLink: string;
	/** Page colours of the active theme (loadMailTheme); null = neutral */
	theme?: MailTheme | null;
	/** Form of address + greeting */
	style?: TextStyle;
};

/** Confirmation to the customer (with .ics attachment) */
export function confirmationMail(c: ConfirmationInput): Mail {
	const dateLabel = c.uhrzeit ? `${c.datumLabel}, ${c.uhrzeit} Uhr` : c.datumLabel;

	const tokens: Record<string, string> = {
		Titel: c.titel,
		Datum: c.datumLabel || '–',
		Uhrzeit: c.uhrzeit || '–',
		Dauer: c.sessionLaenge ? `${c.sessionLaenge} min` : '–',
		Name: c.name || '',
		Firma: c.companyName,
		Ort: c.ortAdresse || c.ortName,
		Wegbeschreibung: c.ortWegbeschreibung,
		'Ort-Telefon': c.ortTelefon,
		'Ort-Karte': c.ortKarte,
		Stornofrist: c.stornoFrist
	};

	const subject = c.customSubject
		? applyTokens(c.customSubject, tokens)
		: `Terminbestätigung: ${c.titel}`;

	// .ics download works with every calendar app (no Google Calendar link)
	const calendarLine = c.datumLabel ? `\nZum Kalender hinzufügen: ${c.icsLink}` : '';
	const customerTzLine = c.convertedTime
		? `\nDer Termin in ${duSie(c.style?.du, 'Ihrer', 'deiner')} Zeitzone (${c.customerTimezone}): ${c.convertedTime}`
		: '';

	const bodyText =
		richTextToMail(c.customBody, tokens) ||
		[
			greetingLine(c.style, c.name),
			``,
			duSie(c.style?.du, 'Ihr Termin', 'Dein Termin') + ' wurde erfolgreich gebucht.',
			``,
			`Angebot: ${c.titel}`,
			`Datum: ${dateLabel}`,
			// Location of the offer (if linked and active)
			...(c.ortName || c.ortAdresse
				? [``, `Ort: ${[c.ortName, c.ortAdresse].filter(Boolean).join(', ')}`]
				: []),
			...(c.ortWegbeschreibung ? [``, `Wegbeschreibung:`, c.ortWegbeschreibung] : []),
			...(c.ortTelefon ? [`Telefon: ${c.ortTelefon}`] : []),
			...(c.ortKarte ? [`Karte: ${c.ortKarte}`] : []),
			``,
			...(c.stornoFrist
				? [
						c.cancelFeePercent && c.offerPrice
							? `Kostenlos stornierbar bis ${c.stornoFrist} Uhr, danach mit einer Stornogebühr von ${c.cancelFeePercent}%.`
							: `Online stornierbar bis ${c.stornoFrist} Uhr, danach bitte direkt bei uns melden.`,
						``
					]
				: []),
			`Bei Fragen stehen wir ${duSie(c.style?.du, 'Ihnen', 'dir')} gerne zur Verfügung.`,
			``,
			`Freundliche Grüsse`,
			c.companyName
		].join('\n');

	// HTML in the page colours (same layout as the guest mails of the resource booking)
	const html = wrapMail(
		textToMailHtml(bodyText + (customerTzLine ? `\n${customerTzLine}` : ''), c.theme) +
			`<p style="margin:20px 0 0;">${
				calendarLine ? mailButton(c.icsLink, 'Zum Kalender hinzufügen', c.theme) : ''
			}${mailButton(c.stornoLink, 'Buchung stornieren', c.theme)}</p>`,
		c.theme,
		{ subject }
	);

	return {
		subject,
		text: bodyText + customerTzLine + calendarLine + `\n\nStornieren: ${c.stornoLink}`,
		html
	};
}

export type ProviderBookingInput = {
	titel: string;
	datumLabel: string;
	uhrzeit: string;
	endzeit: string;
	sessionLaenge: number | null;
	ortName: string;
	ortAdresse: string;
	name?: string;
	email?: string;
	/** Further form fields «Label: Wert» */
	extraLines: string[];
};

/** Notification to the provider about a new online booking (with .ics attachment) */
export function providerBookingMail(p: ProviderBookingInput): Mail {
	return {
		subject: `Neue Buchung: ${p.titel}`,
		text: [
			`Neue Buchung eingegangen.`,
			``,
			`Angebot: ${p.titel}`,
			`Datum: ${p.datumLabel || '–'}`,
			`Zeit: ${p.uhrzeit || '–'}${p.endzeit ? ' – ' + p.endzeit : ''} Uhr`,
			`Dauer: ${p.sessionLaenge ? p.sessionLaenge + ' Minuten' : '–'}`,
			...(p.ortName ? [`Ort: ${p.ortName}`] : []),
			...(p.ortAdresse ? [`Adresse: ${p.ortAdresse}`] : []),
			``,
			`Name: ${p.name || 'Kunde/Kundin'}`,
			...(p.email ? [`E-Mail: ${p.email}`] : []),
			...(p.extraLines.length ? [``, ...p.extraLines] : [])
		].join('\n')
	};
}

type CancelBase = {
	titel: string;
	dateLabel: string;
	name?: string;
	style?: TextStyle;
	/** Page colours of the active theme (loadMailTheme); customer mails get an HTML part */
	theme?: MailTheme | null;
};

/** Cancellation confirmation to the customer (free of charge) */
export function cancelCustomerMail(c: CancelBase): Mail {
	return withHtml(
		{
			subject: `Stornierung bestätigt: ${c.titel}`,
			text: [
				greetingLine(c.style, c.name),
				``,
				`${duSie(c.style?.du, 'Ihre', 'Deine')} Buchung wurde erfolgreich storniert.`,
				``,
				`Angebot: ${c.titel}`,
				`Datum: ${c.dateLabel}`
			].join('\n')
		},
		c.theme
	);
}

/** Cancellation confirmation to the customer with the fee invoice attached */
export function cancelFeeMail(
	c: CancelBase & { freeUntilLabel: string | null; feePercent: number | null; companyName: string }
): Mail {
	return withHtml(
		{
			subject: `Stornierung bestätigt: ${c.titel}`,
			text: [
				greetingLine(c.style, c.name),
				``,
				`${duSie(c.style?.du, 'Ihre', 'Deine')} Buchung wurde storniert.`,
				``,
				`Angebot: ${c.titel}`,
				`Datum: ${c.dateLabel}`,
				``,
				`Da die kostenlose Stornierungsfrist (bis ${c.freeUntilLabel}) abgelaufen war, ` +
					`stellen wir ${duSie(c.style?.du, 'Ihnen', 'dir')} die Stornogebühr von ${c.feePercent}% in Rechnung (siehe Anhang).`,
				``,
				`Freundliche Grüsse`,
				c.companyName
			].join('\n')
		},
		c.theme
	);
}

/** Cancellation notice to the provider */
export function cancelProviderMail(
	c: CancelBase & {
		email?: string;
		feePercent: number | null;
		feeInvoiceNumber: string | null;
		notes: string[];
	}
): Mail {
	return {
		subject: `Buchung storniert: ${c.titel}`,
		text: [
			`Eine Buchung wurde storniert.`,
			``,
			`Angebot: ${c.titel}`,
			`Datum: ${c.dateLabel}`,
			``,
			`Name: ${c.name ?? '–'}`,
			...(c.email ? [`E-Mail: ${c.email}`] : []),
			...(c.feeInvoiceNumber
				? [``, `Stornogebühr ${c.feePercent}%: Rechnung ${c.feeInvoiceNumber}`]
				: []),
			...(c.notes.length ? [``, ...c.notes] : []),
			``,
			`Der Termin ist wieder verfügbar.`
		].join('\n')
	};
}

/** Invoice after the appointment (setting «Rechnung nach dem Termin senden») */
export function bookingInvoiceMail(
	c: CancelBase & { invoiceNumber: string; companyName: string }
): Mail {
	return withHtml(
		{
			subject: `${duSie(c.style?.du, 'Ihre', 'Deine')} Rechnung ${c.invoiceNumber}${c.companyName ? ` – ${c.companyName}` : ''}`,
			text: [
				greetingLine(c.style, c.name),
				``,
				duSie(
					c.style?.du,
					'Vielen Dank für Ihren Besuch. Im Anhang finden Sie die Rechnung für:',
					'Vielen Dank für deinen Besuch. Im Anhang findest du die Rechnung für:'
				),
				``,
				`${c.titel}`,
				c.dateLabel,
				``,
				`Freundliche Grüsse`,
				c.companyName
			].join('\n')
		},
		c.theme
	);
}
