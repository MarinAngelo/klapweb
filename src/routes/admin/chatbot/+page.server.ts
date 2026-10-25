import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { FEATURE_CHATBOT } from '$lib/server/features';
import { loadChatUsage, PRICE_PER_MTOK } from '$lib/server/chatUsage';

export const prerender = false;

// Zugriff: /admin/* ist zentral in hooks.server.ts geschützt (Admin-Session)
export const load: PageServerLoad = async ({ url }) => {
	if (!FEATURE_CHATBOT) throw error(404, 'Nicht gefunden');

	const currentMonth = new Date()
		.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })
		.slice(0, 7);
	const requested = url.searchParams.get('monat') ?? '';
	const month = /^\d{4}-\d{2}$/.test(requested) ? requested : currentMonth;

	try {
		const { months, days } = await loadChatUsage(month);
		return { month, currentMonth, months, days, prices: PRICE_PER_MTOK, loadError: null };
	} catch (e) {
		return {
			month,
			currentMonth,
			months: [],
			days: [],
			prices: PRICE_PER_MTOK,
			loadError: e instanceof Error ? e.message : String(e)
		};
	}
};
