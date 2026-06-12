import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createUser } from '$lib/server/users';
import { env } from '$env/dynamic/private';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/konto');
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const data = await request.formData();
		const honeypot = data.get('website') as string;
		if (honeypot) throw redirect(303, '/konto/anmelden?registered=1');

		const name = (data.get('name') as string)?.trim();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const password = data.get('password') as string;
		const passwordConfirm = data.get('password_confirm') as string;

		if (!name || !email || !password) {
			return fail(400, { error: 'Alle Felder sind erforderlich' });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Passwort muss mindestens 8 Zeichen lang sein' });
		}
		if (password !== passwordConfirm) {
			return fail(400, { error: 'Passwörter stimmen nicht überein' });
		}

		let verifyToken: string;
		try {
			const result = await createUser(email, password, name);
			verifyToken = result.verifyToken;
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Fehler bei der Registrierung';
			return fail(400, { error: msg });
		}

		// Verifikations-E-Mail via Resend senden
		const resendKey = env.RESEND_API_KEY;
		const fromEmail = env.INVOICE_FROM_EMAIL;
		if (resendKey && fromEmail) {
			try {
				const { Resend } = await import('resend');
				const resend = new Resend(resendKey);
				const verifyUrl = `${url.origin}/api/verify-email?token=${verifyToken}`;
				await resend.emails.send({
					from: fromEmail,
					to: email,
					subject: 'E-Mail-Adresse bestätigen',
					html: `
						<p>Hallo ${name},</p>
						<p>Bitte bestätige deine E-Mail-Adresse:</p>
						<p><a href="${verifyUrl}">${verifyUrl}</a></p>
						<p>Der Link ist 24 Stunden gültig.</p>
					`
				});
			} catch {
				// E-Mail-Fehler nicht blockend — User wurde trotzdem erstellt
			}
		}

		throw redirect(303, '/konto/anmelden?registered=1');
	}
};
