import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyEmail } from '$lib/server/users';

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	const success = await verifyEmail(token).catch(() => false);
	throw redirect(303, success ? '/konto/anmelden?verified=1' : '/konto/anmelden?verify_error=1');
};
