/**
 * Form of address of the standard texts (automatic e-mails): setting «Anrede in Standardtexten»
 * (`address_form`, Settings → Main). Default «Sie».
 */

/** true = «Du» form */
export const addressFormDu = (settingsData: unknown) =>
	(settingsData as { address_form?: string } | null)?.address_form === 'Du';

/** Picks the text for the form of address: `duSie(du, 'Ihre Buchung', 'Deine Buchung')` */
export const duSie = (du: boolean | undefined, sie: string, duText: string) => (du ? duText : sie);
