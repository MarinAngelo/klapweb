/**
 * Guest mails for resource bookings in the booking language (buchung.lang).
 * Template texts come from the translated Prismic document, token values are
 * formatted / translated here. Without translation the main language document is used.
 */
import type { Client } from '@prismicio/client';
import { t } from '$lib/i18n/translations';
import { formatDateWithWeekday } from '$lib/utils/formatDate';
import type { RessourceBuchung } from './ressourceBuchungen';

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
export function fallbackSubject(key: string, buchung: RessourceBuchung, ressourceName?: string) {
	return t(key, mailLang(buchung)).replace(
		'{ressource}',
		ressourceName || buchung.ressourceName || buchung.ressourceUid
	);
}

/** Plain text confirmation when the CMS text is empty */
export function bestaetigungFallbackText(
	buchung: RessourceBuchung,
	tokens: Record<string, string>
): string {
	const lang = mailLang(buchung);
	const label = (key: string) => `${t(key, lang)}:`.padEnd(11);
	const zimmerZeilen = (buchung.zimmerauswahl ?? []).map((z) => {
		const bett = t(z.bett_typ, lang);
		return `           · ${z.zimmer_label || z.zimmer_name || bett} (${z.anzahl_betten}× ${bett})`;
	});
	return [
		t('Guten Tag {name}', lang).replace('{name}', buchung.name ?? ''),
		``,
		t('Ihre Buchungsanfrage wurde bestätigt.', lang),
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
		`${t('Ihre Buchungsreferenz', lang)}: ${tokens.Buchungsreferenz}`,
		t('(Diese benötigen Sie für den Check-in und Check-out auf unserer Website.)', lang),
		``,
		t('Wir melden uns in Kürze zur Zahlungsabwicklung.', lang),
		``,
		t('Freundliche Grüsse', lang)
	].join('\n');
}
