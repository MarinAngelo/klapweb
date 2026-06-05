import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { setResetToken, resetPassword } from '$lib/server/users';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ url }) => {
	return { token: url.searchParams.get('token') ?? '' };
};

export const actions: Actions = {
	request: async ({ request, url }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		if (!email) return fail(400, { step: 'request', error: 'E-Mail erforderlich' });

		const result = await setResetToken(email).catch(() => null);

		if (result) {
			const resendKey = env.RESEND_API_KEY;
			const fromEmail = env.INVOICE_FROM_EMAIL;
			if (resendKey && fromEmail) {
				try {
					const { Resend } = await import('resend');
					const resend = new Resend(resendKey);
					const resetUrl = `${url.origin}/konto/passwort-reset?token=${result.token}`;
					await resend.emails.send({
						from: fromEmail,
						to: email,
						subject: 'Passwort zurücksetzen',
						html: `
							<p>Hallo ${result.name},</p>
							<p>Klicke auf den Link um dein Passwort zurückzusetzen:</p>
							<p><a href="${resetUrl}">${resetUrl}</a></p>
							<p>Der Link ist 1 Stunde gültig.</p>
						`
					});
				} catch {
					// ignorieren
				}
			}
		}

		// Immer gleiche Meldung (kein User-Enumeration)
		return { step: 'request', sent: true };
	},

	reset: async ({ request }) => {
		const data = await request.formData();
		const token = data.get('token') as string;
		const password = data.get('password') as string;
		const passwordConfirm = data.get('password_confirm') as string;

		if (!token || !password) return fail(400, { step: 'reset', error: 'Ungültige Anfrage' });
		if (password.length < 8) return fail(400, { step: 'reset', error: 'Passwort muss mindestens 8 Zeichen lang sein' });
		if (password !== passwordConfirm) return fail(400, { step: 'reset', error: 'Passwörter stimmen nicht überein' });

		const success = await resetPassword(token, password).catch(() => false);
		if (!success) return fail(400, { step: 'reset', error: 'Link ungültig oder abgelaufen' });

		return { step: 'reset', success: true };
	}
};
