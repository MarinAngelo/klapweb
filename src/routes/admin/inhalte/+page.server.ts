import type { PageServerLoad } from './$types';
import { createClient, repositoryName } from '$lib/prismicio';
import { checkContent } from '$lib/contentCheck.js';
import { env } from '$env/dynamic/private';
import { getMailAddress } from '$lib/server/mailFrom';

/**
 * Is the domain of the sender address verified in Resend? null = unknown (no key, the key has
 * only sending access, API not reachable) → no message.
 */
async function senderDomainVerified(address: string): Promise<boolean | null> {
	const domain = address.split('@')[1]?.toLowerCase();
	if (!env.RESEND_API_KEY || !domain) return null;
	try {
		const res = await globalThis.fetch('https://api.resend.com/domains', {
			headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
			signal: AbortSignal.timeout(8000)
		});
		if (!res.ok) return null;
		const { data } = (await res.json()) as { data?: { name: string; status: string }[] };
		return (data ?? []).some((d) => d.name.toLowerCase() === domain && d.status === 'verified');
	} catch {
		return null;
	}
}

export const prerender = false;

// Same check as scripts/check-translations.js, for editors (live from Prismic)
export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const result = await checkContent(createClient({ fetch }));
		// Sender domain in Resend (only if the address itself is set)
		const settingsProblem = result.links.find((p) => p.kind === 'mail_from');
		const mailFrom = settingsProblem ? '' : await getMailAddress(fetch);
		if (mailFrom && (await senderDomainVerified(mailFrom)) === false) {
			const settingsDoc = result.links.find((p) => p.doc.type === 'settings')?.doc;
			const client = createClient({ fetch });
			const settings = settingsDoc ? null : await client.getSingle('settings').catch(() => null);
			const doc = settingsDoc ?? {
				id: settings?.id ?? '',
				type: 'settings',
				uid: null,
				lang: settings?.lang ?? result.master,
				title: 'Einstellungen'
			};
			result.links.push({ doc, kind: 'mail_domain', url: mailFrom.split('@')[1] });
		}
		return { ...result, repositoryName, error: null };
	} catch (e) {
		console.error('[admin/inhalte] Prüfung fehlgeschlagen:', e);
		return {
			langs: [],
			master: '',
			missing: [],
			links: [],
			repositoryName,
			error: String(e)
		};
	}
};
