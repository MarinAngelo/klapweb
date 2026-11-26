/**
 * Local tests: every e-mail goes to MAIL_TEST_TO (.env) instead of the real recipient —
 * customers and the website operator never get mails from a developer's test.
 *
 * Only in the dev server (`npm run dev`), never in production, even if the variable is set
 * there by mistake. Installed once in hooks.server.ts by patching the Resend SDK
 * (emails.send/create and batch.send/create), so no sending code can bypass it.
 * The original recipients are put in front of the subject: «[TEST → kunde@… ] Betreff».
 * Netlify Functions (netlify/functions/*) run outside SvelteKit and are not covered.
 */
import { Resend } from 'resend';

type Payload = {
	to?: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	subject?: string;
	[key: string]: unknown;
};

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

function redirect(payload: Payload, target: string): Payload {
	const original = [...list(payload.to), ...list(payload.cc), ...list(payload.bcc)];
	return {
		...payload,
		to: target,
		cc: undefined,
		bcc: undefined,
		subject: `[TEST → ${original.join(', ') || '–'}] ${payload.subject ?? ''}`
	};
}

let installed = false;

export function installMailRedirect(target: string) {
	if (installed || !target) return;
	installed = true;
	const client = new Resend('re_redirect');
	const emails = Object.getPrototypeOf(client.emails);
	const batch = Object.getPrototypeOf(client.batch);
	const create = emails.create;
	emails.create = function (payload: Payload, options?: unknown) {
		return create.call(this, redirect(payload, target), options);
	};
	const batchCreate = batch.create;
	batch.create = function (payload: Payload[], options?: unknown) {
		return batchCreate.call(
			this,
			payload.map((p) => redirect(p, target)),
			options
		);
	};
	console.warn(`[mail] Testmodus: alle E-Mails gehen an ${target} (MAIL_TEST_TO in .env)`);
}
