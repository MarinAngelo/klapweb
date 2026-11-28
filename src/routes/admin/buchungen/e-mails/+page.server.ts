import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { FEATURE_TERMINBUCHUNG } from '$lib/server/features';
import { createClient } from '$lib/prismicio';
import { expandArbeitstag, type TerminSlot } from '$lib/server/terminSlots';
import { cancelDeadline, cancelLink, formatDeadline } from '$lib/server/bookingCancel';
import { textStyleFrom } from '$lib/addressForm';
import { loadMailTheme } from '$lib/mailLayout.js';
import { invoiceSettingsFrom } from '$lib/server/invoicing/settings';
import { getMailAddress, getNotifyTo } from '$lib/server/mailFrom';
import { formatDateWithWeekday } from '$lib/utils/formatDate';
import {
	bookingInvoiceMail,
	cancelCustomerMail,
	cancelFeeMail,
	cancelProviderMail,
	confirmationMail,
	providerBookingMail,
	reminderMail,
	reminderSentProviderMail
} from '$lib/server/bookingMails';
import { SAMPLE_CUSTOMER as SAMPLE, type PreviewMail } from '$lib/server/mailText';

export const prerender = false;

// Access: /admin/* is protected centrally in hooks.server.ts (admin session)
export const load: PageServerLoad = async ({ fetch, url }) => {
	if (!FEATURE_TERMINBUCHUNG) throw error(404, 'Nicht gefunden');

	const client = createClient({ fetch });
	const dynamicClient = client as any;
	const [settings, workdays, offers, theme] = await Promise.all([
		client.getSingle('settings').catch(() => null),
		dynamicClient.getAllByType('arbeitstag').catch(() => []),
		dynamicClient.getAllByType('angebot').catch(() => []),
		loadMailTheme(client).catch(() => null)
	]);
	const s = (settings?.data ?? {}) as Record<string, any>;
	const invoiceSettings = invoiceSettingsFrom(s);

	// Example appointment: next free slot from Prismic (prefers offers with price)
	const today = new Date().toISOString().slice(0, 10);
	const slots: TerminSlot[] = workdays
		.flatMap((doc: any) => expandArbeitstag(doc, offers, today))
		.sort((a: TerminSlot, b: TerminSlot) =>
			`${a.datum}${a.uhrzeit}`.localeCompare(`${b.datum}${b.uhrzeit}`)
		);
	const offerOf = (slot: any) => offers.find((o: any) => o.uid === slot?.angebotId);
	const slot =
		slots.find((sl) => Number((offerOf(sl)?.data as any)?.preis) > 0) ?? slots[0] ?? null;
	const od = (offerOf(slot)?.data ?? {}) as Record<string, any>;

	const titel = slot?.titel ?? 'Beratung';
	const datum = slot?.datum ?? today;
	const uhrzeit = slot?.uhrzeit ?? '10:00';
	const endzeit = slot?.endzeit ?? '11:00';
	const sessionLaenge = slot ? slot.sessionLaenge : 60;
	const zeitzone = slot?.zeitzone ?? 'Europe/Zurich';
	const price = Number(od.preis) > 0 ? Number(od.preis) : null;
	const positive = (v: unknown) => (Number(v) > 0 ? Number(v) : null);
	const cancelHours = positive(od.cancel_free_hours) ?? positive(s.booking_cancel_free_hours);
	const feePercent = positive(od.cancel_fee_percent) ?? positive(s.booking_cancel_fee_percent);

	// Location of the offer (inactive location → none, like the booking)
	let ortName = '';
	let ortAdresse = '';
	let ortWegbeschreibung = '';
	let ortTelefon = '';
	if (od.ort?.uid) {
		const ort = await dynamicClient.getByUID('ort', od.ort.uid).catch(() => null);
		const o = (ort?.data ?? {}) as Record<string, any>;
		if (ort && o.aktiv !== false) {
			const lines = (blocks: unknown) =>
				Array.isArray(blocks) ? blocks.map((b: any) => b?.text ?? '').filter(Boolean) : [];
			ortName = o.name ?? '';
			ortAdresse = lines(o.adresse).join(', ');
			ortWegbeschreibung = lines(o.wegbeschreibung).join('\n');
			ortTelefon = (o.telefon ?? '').trim();
		}
	}

	const freeUntil = cancelDeadline(datum, uhrzeit, zeitzone, cancelHours);
	const stornoFrist = freeUntil ? formatDeadline(freeUntil, zeitzone) : '';
	const datumLabel = formatDateWithWeekday(datum, null, 'de-CH', 'long');
	const dateLabel = formatDateWithWeekday(datum, uhrzeit || null, 'de-CH', 'long');
	const style = textStyleFrom(s);
	const base = { titel, dateLabel, name: SAMPLE.name, style, theme };
	const providerTo = invoiceSettings.email;
	const notifyTo = await getNotifyTo();
	const invoiceAfter = s.booking_invoice === true;
	const sampleInvoice = 'INV-1700000000000';

	const reminderHours = Number(s.booking_reminder_hours) > 0 ? Number(s.booking_reminder_hours) : 0;
	const reminder = reminderMail({
		titel,
		datumLabel,
		uhrzeit,
		sessionLaenge,
		name: SAMPLE.name,
		companyName: (s.responsible_person_company as string) ?? '',
		ortName,
		ortAdresse,
		ortWegbeschreibung,
		ortTelefon,
		ortKarte: ortName || ortAdresse ? 'https://www.openstreetmap.org/…' : '',
		stornoFrist,
		cancelFeePercent: feePercent,
		offerPrice: price,
		icsLink: `${url.origin}/api/termin-ics?id=…`,
		stornoLink: cancelLink(url.origin, { terminId: '…', cancelToken: '…' }),
		theme,
		style
	});

	const mails: PreviewMail[] = [
		{
			id: 'bestaetigung',
			label: 'Terminbestätigung',
			when: 'Nach jeder Online-Buchung; bei Buchung im Admin nur mit «Bestätigung senden».',
			to: SAMPLE.email,
			attachment: 'termin.ics',
			active: true,
			...confirmationMail({
				titel,
				datumLabel,
				uhrzeit,
				sessionLaenge,
				name: SAMPLE.name,
				companyName: (s.responsible_person_company as string) ?? '',
				ortName,
				ortAdresse,
				ortWegbeschreibung,
				ortTelefon,
				ortKarte: ortName || ortAdresse ? 'https://www.openstreetmap.org/…' : '',
				stornoFrist,
				cancelFeePercent: feePercent,
				offerPrice: price,
				customSubject: (s.booking_customer_email_subject as string) || null,
				customBody: Array.isArray(s.booking_customer_email_body)
					? s.booking_customer_email_body
					: null,
				icsLink: `${url.origin}/api/termin-ics?id=…`,
				stornoLink: cancelLink(url.origin, { terminId: '…', cancelToken: '…' }),
				theme,
				style
			})
		},
		{
			id: 'erinnerung',
			label: 'Termin-Erinnerung',
			when: 'Vor dem Termin, so viele Stunden wie unter «Erinnerung: Stunden vor Termin» eingestellt (Einstellungen › Terminbuchung).',
			to: SAMPLE.email,
			active: reminderHours > 0,
			...reminder
		},
		{
			id: 'erinnerung-intern',
			label: 'Erinnerung gesendet (an Sie)',
			when: 'Nach jeder versendeten Termin-Erinnerung.',
			to: notifyTo,
			active: reminderHours > 0,
			...reminderSentProviderMail({
				titel,
				dateLabel,
				name: SAMPLE.name,
				email: SAMPLE.email,
				subject: reminder.subject
			})
		},
		{
			id: 'neue-buchung',
			label: 'Neue Buchung (an Sie)',
			when: 'Nach jeder Online-Buchung, nicht bei Buchungen im Admin.',
			to: providerTo,
			attachment: 'termin.ics',
			active: true,
			...providerBookingMail({
				titel,
				datumLabel,
				uhrzeit,
				endzeit,
				sessionLaenge,
				ortName,
				ortAdresse,
				name: SAMPLE.name,
				email: SAMPLE.email,
				extraLines: ['Telefon: 079 000 00 00']
			})
		},
		{
			id: 'storno',
			label: 'Stornierung bestätigt',
			when: 'Wenn die Kundin / der Kunde kostenlos storniert.',
			to: SAMPLE.email,
			active: true,
			...cancelCustomerMail(base)
		},
		{
			id: 'storno-gebuehr',
			label: 'Stornierung mit Gebühr',
			when: 'Stornierung nach Ablauf der kostenlosen Frist, wenn das Angebot einen Preis und eine Stornogebühr hat.',
			to: SAMPLE.email,
			attachment: invoiceAfter ? `${sampleInvoice}.pdf` : undefined,
			active: !!(freeUntil && feePercent && price),
			...cancelFeeMail({
				...base,
				freeUntilLabel: stornoFrist || '…',
				feePercent: feePercent ?? 50,
				fee: Math.round((price ?? 120) * (feePercent ?? 50)) / 100,
				// «Rechnungsstellung» off → fee only stated, no invoice attached
				invoice: invoiceAfter,
				companyName: invoiceSettings.name
			})
		},
		{
			id: 'storno-intern',
			label: 'Buchung storniert (an Sie)',
			when: 'Bei jeder Stornierung.',
			to: notifyTo,
			active: true,
			...cancelProviderMail({
				...base,
				email: SAMPLE.email,
				feePercent,
				feeInvoiceNumber: null,
				notes: []
			})
		},
		{
			id: 'rechnung',
			label: 'Rechnung nach dem Termin',
			when: 'Nach Terminende, wenn «Rechnungsstellung» aktiv ist und das Angebot einen Preis hat.',
			to: SAMPLE.email,
			attachment: `${sampleInvoice}.pdf`,
			active: invoiceAfter,
			...bookingInvoiceMail({
				...base,
				invoiceNumber: sampleInvoice,
				companyName: invoiceSettings.name
			})
		}
	];

	return {
		mails,
		from: await getMailAddress(),
		style,
		example: { titel, dateLabel, fromPrismic: !!slot }
	};
};
