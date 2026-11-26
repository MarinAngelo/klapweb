import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { FEATURE_RESSOURCENBUCHUNG } from '$lib/server/features';
import { createClient } from '$lib/prismicio';
import { loadMailTheme } from '$lib/mailLayout.js';
import { loadVariablesData, mailVariables } from '$lib/variables.js';
import { messengerButtonsHtml } from '$lib/messengerLinks.js';
import { getMailAddress, getNotifyTo } from '$lib/server/mailFrom';
import {
	SAMPLE_CUSTOMER as SAMPLE,
	previewLanguages,
	type PreviewMail
} from '$lib/server/mailText';
import type { RessourceBuchung } from '$lib/server/ressourceBuchungen';
import {
	arrivalReminderMail,
	checkInMail,
	checkoutBillingMail,
	cmsReminderMail,
	confirmationGuestMail,
	finalBillingMail,
	getRessourceDocForBooking,
	reminderTokens,
	requestProviderMail,
	type CmsMailContext
} from '$lib/server/ressourceMail';

export const prerender = false;

const day = (offset: number) => {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + offset);
	return d.toISOString().slice(0, 10);
};

// Access: /admin/* is protected centrally in hooks.server.ts (admin session)
export const load: PageServerLoad = async ({ fetch, url }) => {
	if (!FEATURE_RESSOURCENBUCHUNG) throw error(404, 'Nicht gefunden');

	const client = createClient({ fetch });
	const languages = await previewLanguages(client);
	// Language of the guest mails: ?mail_lang=, otherwise the main language
	const lang =
		languages.find((l) => l.id === url.searchParams.get('mail_lang'))?.id ?? languages[0]?.id;
	const [ressourcen, settings, variablesData, theme] = await Promise.all([
		(client as any).getAllByType('ressource').catch(() => []),
		client.getSingle('settings').catch(() => null),
		loadVariablesData(client).catch(() => null),
		loadMailTheme(client, lang).catch(() => null)
	]);
	// Example: first resource with its own mail texts, in the chosen language (else main language)
	const uid = ressourcen[0]?.uid as string | undefined;
	const doc = uid
		? (((await getRessourceDocForBooking(client, { ressourceUid: uid, lang }).catch(() => null))
				?.data ?? null) as Record<string, any> | null)
		: null;
	const cms: CmsMailContext = { doc, vars: mailVariables(variablesData, lang), theme };
	const ressourceName = doc?.name || 'Ferienwohnung';

	const buchung: RessourceBuchung = {
		id: 'beispiel',
		referenz: 'AB12CD',
		ressourceUid: uid ?? 'beispiel',
		ressourceName,
		von: day(14),
		bis: day(17),
		personen: 2,
		zimmerauswahl: [],
		preisCHF: 450,
		bookedAt: new Date().toISOString(),
		status: 'confirmed',
		name: SAMPLE.name,
		email: SAMPLE.email,
		lang
	};
	const notifyTo = await getNotifyTo();
	const waTel = (settings?.data as any)?.whatsapp_tel as string | undefined;
	// Door code is never shown in the preview
	const tokens = reminderTokens(buchung, '••••', messengerButtonsHtml(waTel));
	const aufgaben = [{ titel: 'Rasen mähen', credits: 30 }];
	const link = (path: string) => `${url.origin}/api/${path}?id=…&token=…`;
	const afterArrival = cmsReminderMail(
		buchung,
		cms,
		tokens,
		'nach_ankunft',
		'Willkommen: {ressource}'
	);
	const departure = cmsReminderMail(
		buchung,
		cms,
		tokens,
		'abreise',
		'Ihre Abreise morgen: {ressource}'
	);
	const missing = {
		subject: '–',
		text: 'Kein Text im Inhalts-Typ «Ressource» erfasst — diese E-Mail wird nicht verschickt.'
	};

	const mails: PreviewMail[] = [
		{
			id: 'anfrage',
			label: 'Neue Buchungsanfrage (an Sie)',
			when: 'Nach jeder Buchungsanfrage auf der Website, mit Link zum Bestätigen.',
			to: notifyTo,
			active: true,
			...requestProviderMail({
				...buchung,
				ressourceName,
				nachricht: 'Wir reisen mit einem Hund.',
				bestaetigungsLink: link('bestaetige-buchung')
			})
		},
		{
			id: 'bestaetigung',
			label: 'Buchungsbestätigung',
			when: 'Wenn Sie die Anfrage bestätigen. Text: Inhalts-Typ «Ressource» (Buchungsbestätigung), sonst Standardtext.',
			to: SAMPLE.email,
			active: true,
			...confirmationGuestMail(buchung, cms)
		},
		{
			id: 'ankunft',
			label: 'Ankunftserinnerung',
			when: '48 Stunden vor der Anreise, bei kurzfristiger Bestätigung sofort. Text: Inhalts-Typ «Ressource» (Erinnerung).',
			to: SAMPLE.email,
			active: true,
			...arrivalReminderMail(buchung, cms, tokens)
		},
		{
			id: 'nach-ankunft',
			label: 'Nach der Ankunft',
			when: '24 Stunden nach der Anreise, nur mit Text im Inhalts-Typ «Ressource».',
			to: SAMPLE.email,
			active: !!afterArrival,
			...(afterArrival ?? missing)
		},
		{
			id: 'abreise',
			label: 'Abreiseerinnerung',
			when: 'Am Vorabend der Abreise, nur mit Text im Inhalts-Typ «Ressource».',
			to: SAMPLE.email,
			active: !!departure,
			...(departure ?? missing)
		},
		{
			id: 'check-in',
			label: 'Check-in (an Sie)',
			when: 'Wenn der Gast auf der Website eincheckt oder Sie den Check-in im Admin setzen.',
			to: notifyTo,
			active: true,
			...checkInMail({ ...buchung, items: ['Schlüssel erhalten'] })
		},
		{
			id: 'check-out',
			label: 'Abrechnung freigeben (an Sie)',
			when: 'Nach dem Check-out, mit Link zum Prüfen und Freigeben der Abrechnung.',
			to: notifyTo,
			active: true,
			...checkoutBillingMail({
				...buchung,
				creditsCHF: 30,
				abrechnungBetrag: 420,
				aufgaben,
				freigabeLink: link('freigabe-abrechnung')
			})
		},
		{
			id: 'abrechnung',
			label: 'Abrechnung',
			when: 'Wenn Sie die Abrechnung freigeben.',
			to: SAMPLE.email,
			active: true,
			...finalBillingMail({
				...buchung,
				creditsCHF: 30,
				aufgaben,
				betrag: 420,
				betragEur: null,
				eurRate: null
			})
		}
	];

	return {
		mails,
		from: await getMailAddress(),
		languages,
		// not «lang»: $page.data.lang sets the language of the admin UI
		mailLang: lang ?? '',
		example: { ressourceName, fromPrismic: !!doc }
	};
};
