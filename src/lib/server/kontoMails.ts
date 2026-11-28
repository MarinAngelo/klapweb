/**
 * E-mails of the customer account (feature `kundenkonto`): e-mail verification, password reset.
 * Pure builders in the style of the settings (Du/Sie, greeting, closing — getTextStyle()).
 */
import { closingLine, duSie, greetingLine, type TextStyle } from '$lib/addressForm';
import { plainTextMail, type Mail } from '$lib/server/mailText';

/** After the registration: confirm the e-mail address (link valid 24 h) */
export function verifyEmailMail(c: { name?: string; link: string; style?: TextStyle }): Mail {
	return {
		subject: 'E-Mail-Adresse bestätigen',
		...plainTextMail(
			[
				greetingLine(c.style, c.name),
				``,
				duSie(
					c.style?.du,
					'Bitte bestätigen Sie Ihre E-Mail-Adresse:',
					'Bitte bestätige deine E-Mail-Adresse:'
				),
				c.link,
				``,
				`Der Link ist 24 Stunden gültig.`,
				``,
				closingLine(c.style)
			].join('\n')
		)
	};
}

/** Password reset link (valid 1 h) */
export function passwordResetMail(c: { name?: string; link: string; style?: TextStyle }): Mail {
	return {
		subject: 'Passwort zurücksetzen',
		...plainTextMail(
			[
				greetingLine(c.style, c.name),
				``,
				duSie(
					c.style?.du,
					'Klicken Sie auf den Link, um Ihr Passwort zurückzusetzen:',
					'Klicke auf den Link, um dein Passwort zurückzusetzen:'
				),
				c.link,
				``,
				`Der Link ist 1 Stunde gültig.`,
				``,
				closingLine(c.style)
			].join('\n')
		)
	};
}
