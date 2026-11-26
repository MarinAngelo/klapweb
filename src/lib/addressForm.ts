/**
 * Style of the standard texts (automatic e-mails), Settings → Main:
 * - «Anrede in Standardtexten» (`address_form`, Sie/Du, default «Sie»)
 * - «Begrüssung in Standardtexten» (`mail_greeting`, default «Guten Tag», e.g. «Hallo»)
 */

export type TextStyle = { du: boolean; greeting: string };

export const DEFAULT_GREETING = 'Guten Tag';

/** true = «Du» form */
export const addressFormDu = (settingsData: unknown) =>
	(settingsData as { address_form?: string } | null)?.address_form === 'Du';

export const textStyleFrom = (settingsData: unknown): TextStyle => ({
	du: addressFormDu(settingsData),
	greeting:
		String((settingsData as { mail_greeting?: string } | null)?.mail_greeting ?? '').trim() ||
		DEFAULT_GREETING
});

/** Picks the text for the form of address: `duSie(style?.du, 'Ihre Buchung', 'Deine Buchung')` */
export const duSie = (du: boolean | undefined, sie: string, duText: string) => (du ? duText : sie);

/** «Guten Tag Anna Muster» / «Hallo Anna Muster» / «Hallo» */
export const greetingLine = (style: TextStyle | undefined, name?: string) =>
	`${style?.greeting || DEFAULT_GREETING}${name ? ' ' + name : ''}`;
