import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PrismicDocument } from '@prismicio/client';
import { createClient } from '$lib/prismicio';
import { FEATURE_NEWSLETTER } from '$lib/server/features';
import {
	countUnsubscribed,
	loadBranding,
	getRecipients,
	listSends,
	listSubscribersWithStatus,
	removeSubscriber,
	logSend,
	sendNewsletter
} from '$lib/server/newsletter';

export const prerender = false;

function checkAccess(url: URL) {
	if (!FEATURE_NEWSLETTER) throw error(404, 'Nicht gefunden');
	const secret = env.ADMIN_SECRET;
	if (!secret || url.searchParams.get('secret') !== secret) throw error(403, 'Kein Zugriff');
}

// Custom type is feature-gated → not part of the generated Prismic types
type AnyClient = { getAllByType: Function; getByUID: Function; getSingle: Function };

async function loadNewsletter(client: AnyClient, uid: string) {
	const docs: PrismicDocument[] = await client.getAllByType('newsletter', { lang: '*' });
	return docs.find((d) => d.uid === uid) ?? null;
}

export const load: PageServerLoad = async ({ url, fetch }) => {
	checkAccess(url);
	const client = createClient({ fetch }) as unknown as AnyClient;

	let newsletters: { uid: string; subject: string; lang: string; publishedAt: string }[] = [];
	let recipients: Awaited<ReturnType<typeof getRecipients>> = [];
	let unsubscribedCount = 0;
	let sends: Awaited<ReturnType<typeof listSends>> = [];
	let subscribers: Awaited<ReturnType<typeof listSubscribersWithStatus>> = [];
	let loadError: string | null = null;

	try {
		const docs: PrismicDocument[] = await client.getAllByType('newsletter', { lang: '*' });
		newsletters = docs
			.map((d) => ({
				uid: d.uid ?? '',
				subject: (d.data.subject as string) || d.uid || '',
				lang: d.lang,
				publishedAt: d.last_publication_date
			}))
			.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
	} catch (e) {
		loadError = e instanceof Error ? e.message : String(e);
	}

	try {
		[recipients, unsubscribedCount, sends, subscribers] = await Promise.all([
			getRecipients(),
			countUnsubscribed(),
			listSends(),
			listSubscribersWithStatus()
		]);
	} catch (e) {
		loadError = e instanceof Error ? e.message : String(e);
	}

	return {
		newsletters,
		recipients,
		recipientCount: recipients.length,
		unsubscribedCount,
		sends,
		subscribers,
		loadError,
		mailConfigured: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM_ADDRESS),
		defaultTestEmail: env.INVOICE_TO_EMAIL || env.EMAIL_FROM_ADDRESS || ''
	};
};

/** Sends a newsletter to the given recipients and logs the send */
async function sendAndLog(
	client: AnyClient,
	uid: string,
	recipients: Awaited<ReturnType<typeof getRecipients>>,
	mode: 'alle' | 'auswahl',
	origin: string
) {
	if (!recipients.length) return fail(400, { error: 'Keine Empfänger vorhanden' });
	const doc = await loadNewsletter(client, uid);
	if (!doc) return fail(404, { error: 'Newsletter nicht gefunden' });

	try {
		const branding = await loadBranding(client, doc.lang);
		const result = await sendNewsletter(doc as any, branding, recipients, origin);
		await logSend({
			uid,
			subject: (doc.data.subject as string) || uid,
			sentAt: new Date().toISOString(),
			recipientCount: result.sent,
			failedCount: result.failed,
			errors: result.errors.length ? result.errors : undefined,
			mode
		});
		if (result.failed) {
			return fail(500, {
				error: result.errors.join(', '),
				sent: result.sent,
				failed: result.failed
			});
		}
		return { sent: result.sent };
	} catch (e) {
		return fail(500, { error: e instanceof Error ? e.message : String(e) });
	}
}

export const actions: Actions = {
	test: async ({ request, url, fetch }) => {
		checkAccess(url);
		const form = await request.formData();
		const uid = String(form.get('uid') ?? '');
		const testEmail = String(form.get('testEmail') ?? '').trim();
		if (!uid || !testEmail) return fail(400, { error: 'Newsletter und Test-Adresse angeben' });

		const client = createClient({ fetch }) as unknown as AnyClient;
		const doc = await loadNewsletter(client, uid);
		if (!doc) return fail(404, { error: 'Newsletter nicht gefunden' });

		try {
			const branding = await loadBranding(client, doc.lang);
			const result = await sendNewsletter(
				doc as any,
				branding,
				[{ email: testEmail, vorname: 'Test', nachname: 'Empfänger', firma: 'Test AG' }],
				url.origin
			);
			if (result.failed) return fail(500, { error: result.errors.join(', ') });
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : String(e) });
		}
		return { testSent: testEmail };
	},

	send: async ({ request, url, fetch }) => {
		checkAccess(url);
		const form = await request.formData();
		// Checkbox sends its value ("on") only when checked — presence is the confirmation
		if (!form.has('confirm')) return fail(400, { error: 'Bitte den Versand bestätigen' });
		const client = createClient({ fetch }) as unknown as AnyClient;
		return sendAndLog(
			client,
			String(form.get('uid') ?? ''),
			await getRecipients(),
			'alle',
			url.origin
		);
	},

	removeSubscriber: async ({ request, url }) => {
		checkAccess(url);
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		try {
			if (!(await removeSubscriber(email))) return fail(404, { error: 'Abonnent nicht gefunden' });
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : String(e) });
		}
		return { removed: email };
	},

	sendSelected: async ({ request, url, fetch }) => {
		checkAccess(url);
		const form = await request.formData();
		if (!form.has('confirm')) return fail(400, { error: 'Bitte den Versand bestätigen' });
		// Only addresses that are real, not unsubscribed customers — never arbitrary input
		const selected = new Set(form.getAll('email').map((e) => String(e).trim().toLowerCase()));
		if (!selected.size) return fail(400, { error: 'Bitte mindestens einen Kunden auswählen' });
		const recipients = (await getRecipients()).filter((r) => selected.has(r.email));
		const client = createClient({ fetch }) as unknown as AnyClient;
		return sendAndLog(client, String(form.get('uid') ?? ''), recipients, 'auswahl', url.origin);
	}
};
