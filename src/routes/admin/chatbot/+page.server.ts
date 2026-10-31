import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { FEATURE_CHATBOT } from '$lib/server/features';
import { loadChatUsage, PRICE_PER_MTOK } from '$lib/server/chatUsage';
import {
	deleteChatConversation,
	isValidConversationId,
	loadChatConversations,
	purgeOldChatLogs,
	RETENTION_DAYS
} from '$lib/server/chatLog';

export const prerender = false;

const MONTH = /^\d{4}-\d{2}$/;

// Zugriff: /admin/* ist zentral in hooks.server.ts geschützt (Admin-Session)
export const load: PageServerLoad = async ({ url }) => {
	if (!FEATURE_CHATBOT) throw error(404, 'Nicht gefunden');

	const currentMonth = new Date()
		.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })
		.slice(0, 7);
	const requested = url.searchParams.get('monat') ?? '';
	const month = MONTH.test(requested) ? requested : currentMonth;

	// Retention: entries older than RETENTION_DAYS are removed whenever the page is opened
	await purgeOldChatLogs().catch((e) => console.error('[chatbot] Bereinigung fehlgeschlagen:', e));

	const [usage, conversations] = await Promise.allSettled([
		loadChatUsage(month),
		loadChatConversations(month)
	]);
	const loadError = [usage, conversations]
		.filter((r) => r.status === 'rejected')
		.map((r) => {
			const reason = (r as PromiseRejectedResult).reason;
			return reason instanceof Error ? reason.message : String(reason);
		})
		.join(' · ');

	return {
		month,
		currentMonth,
		months: usage.status === 'fulfilled' ? usage.value.months : [],
		days: usage.status === 'fulfilled' ? usage.value.days : [],
		conversations: conversations.status === 'fulfilled' ? conversations.value : [],
		retentionDays: RETENTION_DAYS,
		prices: PRICE_PER_MTOK,
		loadError: loadError || null
	};
};

export const actions: Actions = {
	deleteConversation: async ({ request }) => {
		if (!FEATURE_CHATBOT) throw error(404, 'Nicht gefunden');
		const form = await request.formData();
		const month = String(form.get('month') ?? '');
		const conversation = form.get('conversation');
		if (!MONTH.test(month) || !isValidConversationId(conversation)) {
			return fail(400, { error: 'Ungültige Angaben' });
		}
		await deleteChatConversation(month, conversation);
		return { deleted: conversation };
	}
};
