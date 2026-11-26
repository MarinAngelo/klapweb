import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { FEATURE_RESSOURCENBUCHUNG } from '$lib/server/features';
import { createClient } from '$lib/prismicio';
import { textStyleFrom } from '$lib/addressForm';
import { loadMailTheme } from '$lib/mailLayout.js';
import { getMailAddress } from '$lib/server/mailFrom';
import { SAMPLE_CUSTOMER as SAMPLE, type PreviewMail } from '$lib/server/mailText';
import {
	taskAcceptedOperatorMail,
	taskApprovedMail,
	taskConfirmedMail,
	taskSubmittedLines,
	taskSubmittedMail,
	taskSubmittedOperatorMail
} from '$lib/server/aufgabenMails';

export const prerender = false;

// Access: /admin/* is protected centrally in hooks.server.ts (admin session)
export const load: PageServerLoad = async ({ fetch, url }) => {
	if (!FEATURE_RESSOURCENBUCHUNG) throw error(404, 'Nicht gefunden');

	const client = createClient({ fetch });
	const [settings, theme] = await Promise.all([
		client.getSingle('settings').catch(() => null),
		loadMailTheme(client).catch(() => null)
	]);
	const s = (settings?.data ?? {}) as Record<string, any>;
	const style = textStyleFrom(s);
	// Operator mails of the tasks go to «Verantwortliche E-Mail», else «Korrespondenz E-Mail»
	const operatorTo = (s.responsible_email as string) || (s.e_mail as string) || '';
	const guest = { name: SAMPLE.name, style, theme };
	const titel = 'Rasen mähen';
	const buchungId = 'AB12CD';
	const lines = taskSubmittedLines({
		titel,
		minuten: 60,
		kommentar: 'Auch die Ränder geschnitten.',
		credits: 30,
		buchungspreis: 450
	});

	const mails: PreviewMail[] = [
		{
			id: 'angenommen',
			label: 'Aufgabe angenommen (an Sie)',
			when: 'Wenn ein Gast eine Aufgabe annimmt, mit Link zum Freigeben.',
			to: operatorTo,
			active: true,
			...taskAcceptedOperatorMail({
				titel,
				name: SAMPLE.name,
				email: SAMPLE.email,
				buchungId,
				freigabeLink: `${url.origin}/api/freigabe-aufgabe?id=…&token=…`
			})
		},
		{
			id: 'bestaetigt',
			label: 'Aufgabe bestätigt',
			when: 'Wenn Sie die Annahme freigeben (Link in der E-Mail oder in der Liste).',
			to: SAMPLE.email,
			active: true,
			...taskConfirmedMail({ ...guest, titel, creditTyp: 'offen', buchungId })
		},
		{
			id: 'abgegeben',
			label: 'Abrechnung der Aufgabe',
			when: 'Wenn der Gast die erledigte Aufgabe abgibt.',
			to: SAMPLE.email,
			active: true,
			...taskSubmittedMail({ ...guest, titel, lines })
		},
		{
			id: 'abgegeben-intern',
			label: 'Aufgabe abgegeben (an Sie)',
			when: 'Wenn der Gast die erledigte Aufgabe abgibt, mit einem allfälligen Foto im Anhang.',
			to: operatorTo,
			active: true,
			...taskSubmittedOperatorMail({
				titel,
				name: SAMPLE.name,
				email: SAMPLE.email,
				buchungId,
				lines
			})
		},
		{
			id: 'freigegeben',
			label: 'Aufgabe freigegeben',
			when: 'Wenn Sie die erledigte Aufgabe prüfen und freigeben.',
			to: SAMPLE.email,
			active: true,
			...taskApprovedMail({
				...guest,
				titel,
				creditTyp: 'offen',
				minuten: 60,
				kommentar: 'Auch die Ränder geschnitten.',
				baseCredits: 30,
				adjustment: 5,
				finalCredits: 35,
				buchungspreis: 450,
				betreiberAntwort: 'Danke, sehr sauber gemacht!'
			})
		}
	];

	return { mails, from: await getMailAddress(), style };
};
