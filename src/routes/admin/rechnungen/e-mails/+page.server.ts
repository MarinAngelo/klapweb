import type { PageServerLoad } from './$types';
import { createClient } from '$lib/prismicio';
import { FEATURE_ECOMMERCE, FEATURE_GLOBAL_EVENTS } from '$lib/server/features';
import { textStyleFrom } from '$lib/addressForm';
import { loadMailTheme } from '$lib/mailLayout.js';
import { invoiceSettingsFrom } from '$lib/server/invoicing/settings';
import { getMailAddress, getNotifyTo } from '$lib/server/mailFrom';
import { SAMPLE_CUSTOMER as SAMPLE, type PreviewMail } from '$lib/server/mailText';
import {
	adminInvoiceMail,
	checkoutBusinessMail,
	checkoutInvoiceMail,
	dunningMail,
	dunningOperatorMail,
	recurringInvoiceMail,
	recurringOperatorMail
} from '$lib/server/invoiceMails';

export const prerender = false;

const day = (offset: number) => {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + offset);
	return d.toISOString().slice(0, 10).split('-').reverse().join('.');
};

// Access: /admin/* is protected centrally in hooks.server.ts (admin session)
export const load: PageServerLoad = async ({ fetch }) => {
	const client = createClient({ fetch });
	const [settings, theme] = await Promise.all([
		client.getSingle('settings').catch(() => null),
		loadMailTheme(client).catch(() => null)
	]);
	const s = (settings?.data ?? {}) as Record<string, any>;
	const co = invoiceSettingsFrom(s);
	const style = textStyleFrom(s);
	const notifyTo = await getNotifyTo();
	const base = { name: SAMPLE.name, companyName: co.name, style, theme };
	const nr = 'INV-1700000000000';
	const pdf = `${nr}.pdf`;
	const amount = `${co.currency} 250.00`;

	const checkoutActive = FEATURE_ECOMMERCE || FEATURE_GLOBAL_EVENTS;
	const template = {
		subject: (s.payment_rechnung_email_subject as string) || null,
		body: Array.isArray(s.payment_rechnung_email_body) ? s.payment_rechnung_email_body : null
	};
	const tokens: Record<string, string> = {
		Rechnungsnummer: nr,
		Kundenname: SAMPLE.name,
		Vorname: SAMPLE.vorname,
		Nachname: SAMPLE.nachname,
		Email: SAMPLE.email,
		Dienstleistung: 'Beispiel-Leistung',
		Betrag: amount,
		Waehrung: co.currency,
		Firma: co.name,
		Zahlungsfrist: String(co.paymentTermsDays)
	};
	const dunningNote = `${nr} (${SAMPLE.name}): 1. Mahnung an ${SAMPLE.email} gesendet, neue Frist ${day(co.dunningTermsDays)}.`;

	const mails: PreviewMail[] = [
		{
			id: 'rechnung',
			label: 'Rechnung',
			when: 'Beim Erstellen einer Rechnung mit «E-Mail senden» oder beim Senden aus der Rechnungsliste.',
			to: SAMPLE.email,
			attachment: pdf,
			active: true,
			...adminInvoiceMail({ ...base, invoiceNumber: nr })
		},
		{
			id: 'bestellung',
			label: 'Bestellung gegen Rechnung',
			when: 'Nach einer Bestellung oder Event-Anmeldung auf der Website mit Zahlung «gegen Rechnung». Eigener Text: Einstellungen (E-Mail bei Zahlung gegen Rechnung).',
			to: SAMPLE.email,
			attachment: pdf,
			active: checkoutActive,
			...checkoutInvoiceMail({ ...base, invoiceNumber: nr, template, tokens })
		},
		{
			id: 'bestellung-intern',
			label: 'Neue Bestellung (an Sie)',
			when: 'Nach jeder Bestellung gegen Rechnung auf der Website.',
			to: co.email,
			attachment: pdf,
			active: checkoutActive,
			...checkoutBusinessMail({
				invoiceNumber: nr,
				customerName: SAMPLE.name,
				customerEmail: SAMPLE.email,
				service: 'Beispiel-Leistung',
				fieldLines: [
					`Vorname: ${SAMPLE.vorname}`,
					`Nachname: ${SAMPLE.nachname}`,
					`E-Mail: ${SAMPLE.email}`
				]
			})
		},
		{
			id: 'wiederkehrend',
			label: 'Jährliche Rechnung',
			when: 'Am Fälligkeitstag einer Rechnung mit «Jährlich wiederholen».',
			to: SAMPLE.email,
			attachment: pdf,
			active: true,
			...recurringInvoiceMail({ ...base, invoiceNumber: nr })
		},
		{
			id: 'wiederkehrend-intern',
			label: 'Jährliche Rechnung erstellt (an Sie)',
			when: 'Zusammen mit jeder jährlichen Rechnung.',
			to: notifyTo,
			active: true,
			...recurringOperatorMail({
				invoiceNumber: nr,
				templateNumber: 'INV-1600000000000',
				name: SAMPLE.name,
				sentTo: SAMPLE.email,
				nextDate: day(365).split('.').reverse().join('-')
			})
		},
		{
			id: 'mahnung',
			label: 'Mahnung',
			when: 'Wenn «Automatisch mahnen» aktiv ist: offene Rechnung nach Ablauf der Zahlungsfrist plus «Mahnung nach … Tagen». Höchstens 2 Mahnungen.',
			to: SAMPLE.email,
			attachment: pdf,
			active: co.dunningActive,
			...dunningMail({
				...base,
				level: 1,
				invoiceNumber: nr,
				invoiceDate: day(-(co.paymentTermsDays + co.dunningDays)),
				amount,
				dueDate: day(co.dunningTermsDays)
			})
		},
		{
			id: 'mahnung-intern',
			label: 'Mahnwesen (an Sie)',
			when: 'Nach jedem Mahnlauf mit mindestens einer Mahnung.',
			to: notifyTo,
			active: co.dunningActive,
			...dunningOperatorMail([dunningNote])
		}
	];

	return { mails, from: await getMailAddress(), style };
};
