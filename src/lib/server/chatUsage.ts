/**
 * Chat-Bot usage & estimated costs (admin section "Chat-Bot").
 *
 * Blob store `chat_usage`, no message content is stored:
 * - `q/YYYY-MM-DD/<ts>-<id>_<input>_<cacheWrite>_<cacheRead>_<output>_<microUSD>`: one entry per
 *   answered question. All numbers are in the key, so a month is summed with list() alone.
 *   Append-only on purpose: conditional writes (ETag) are not enforced when Blobs are accessed
 *   via siteID + token, so a shared counter would lose parallel updates.
 * - `month/YYYY-MM`: summary of a closed month, written once when the overview is opened.
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';

// Claude Haiku 4.5 list prices in USD per million tokens (update if Anthropic changes them)
export const PRICE_PER_MTOK = { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 };

export type UsageTotals = {
	questions: number;
	input: number;
	cacheWrite: number;
	cacheRead: number;
	output: number;
	usd: number;
};

export type AnthropicUsage = {
	input_tokens?: number;
	cache_creation_input_tokens?: number;
	cache_read_input_tokens?: number;
	output_tokens?: number;
};

type MonthSummary = { totals: UsageTotals; days: Record<string, UsageTotals> };

const RAW_PREFIX = 'q/';
const SUMMARY_PREFIX = 'month/';

const empty = (): UsageTotals => ({
	questions: 0,
	input: 0,
	cacheWrite: 0,
	cacheRead: 0,
	output: 0,
	usd: 0
});

function getUsageStore() {
	return getStore({
		name: 'chat_usage',
		siteID: env.NETLIFY_SITE_ID ?? '',
		token: env.NETLIFY_TOKEN ?? '',
		consistency: 'strong'
	});
}

/** Swiss local date as YYYY-MM-DD */
function today(): string {
	return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
}

export function usageToTotals(usage: AnthropicUsage): UsageTotals {
	const input = usage.input_tokens ?? 0;
	const cacheWrite = usage.cache_creation_input_tokens ?? 0;
	const cacheRead = usage.cache_read_input_tokens ?? 0;
	const output = usage.output_tokens ?? 0;
	const usd =
		(input * PRICE_PER_MTOK.input +
			cacheWrite * PRICE_PER_MTOK.cacheWrite +
			cacheRead * PRICE_PER_MTOK.cacheRead +
			output * PRICE_PER_MTOK.output) /
		1_000_000;
	return { questions: 1, input, cacheWrite, cacheRead, output, usd };
}

function add(a: UsageTotals, b: UsageTotals): UsageTotals {
	return {
		questions: a.questions + b.questions,
		input: a.input + b.input,
		cacheWrite: a.cacheWrite + b.cacheWrite,
		cacheRead: a.cacheRead + b.cacheRead,
		output: a.output + b.output,
		usd: a.usd + b.usd
	};
}

/** Adds one answered question (price is fixed at the time of the question) */
export async function recordChatUsage(usage: AnthropicUsage): Promise<void> {
	const t = usageToTotals(usage);
	const id = `${Date.now()}-${randomUUID().slice(0, 8)}`;
	const numbers = [t.input, t.cacheWrite, t.cacheRead, t.output, Math.round(t.usd * 1e6)];
	await getUsageStore().set(`${RAW_PREFIX}${today()}/${id}_${numbers.join('_')}`, '');
}

function parseRawKey(key: string): { day: string; totals: UsageTotals } | null {
	const [, day, entry] = key.split('/');
	const [, input, cacheWrite, cacheRead, output, microUsd] = (entry ?? '').split('_').map(Number);
	if (!day || [input, cacheWrite, cacheRead, output, microUsd].some((n) => !Number.isFinite(n))) {
		return null;
	}
	return {
		day,
		totals: { questions: 1, input, cacheWrite, cacheRead, output, usd: microUsd / 1e6 }
	};
}

/** Sums the raw entries of one month (YYYY-MM) per day */
async function summarizeMonth(
	store: ReturnType<typeof getUsageStore>,
	month: string
): Promise<MonthSummary> {
	const { blobs } = await store.list({ prefix: `${RAW_PREFIX}${month}-` });
	const summary: MonthSummary = { totals: empty(), days: {} };
	for (const { key } of blobs) {
		const parsed = parseRawKey(key);
		if (!parsed) continue;
		summary.days[parsed.day] = add(summary.days[parsed.day] ?? empty(), parsed.totals);
		summary.totals = add(summary.totals, parsed.totals);
	}
	return summary;
}

/** Month totals (newest first) and the day totals of `month` (YYYY-MM) */
export async function loadChatUsage(month: string) {
	const store = getUsageStore();
	const currentMonth = today().slice(0, 7);

	const { blobs: summaryBlobs } = await store.list({ prefix: SUMMARY_PREFIX });
	const summaries = new Map<string, MonthSummary>(
		await Promise.all(
			summaryBlobs.map(
				async ({ key }) =>
					[
						key.slice(SUMMARY_PREFIX.length),
						(await store.get(key, { type: 'json' })) as MonthSummary
					] as const
			)
		)
	);

	// Closed months without a summary yet → sum once and store
	const { directories } = await store.list({ prefix: RAW_PREFIX, directories: true });
	const rawMonths = new Set(
		directories.map((dir) => dir.slice(RAW_PREFIX.length, RAW_PREFIX.length + 7))
	);
	for (const m of rawMonths) {
		if (m >= currentMonth || summaries.has(m)) continue;
		const summary = await summarizeMonth(store, m);
		await store.setJSON(`${SUMMARY_PREFIX}${m}`, summary);
		summaries.set(m, summary);
	}

	// Current month is always summed live
	if (rawMonths.has(currentMonth)) {
		summaries.set(currentMonth, await summarizeMonth(store, currentMonth));
	}

	const months = [...summaries]
		.map(([period, s]) => ({ period, totals: { ...empty(), ...s.totals } }))
		.sort((a, b) => b.period.localeCompare(a.period));
	const days = Object.entries(summaries.get(month)?.days ?? {})
		.map(([period, totals]) => ({ period, totals: { ...empty(), ...totals } }))
		.sort((a, b) => b.period.localeCompare(a.period));

	return { months, days };
}
