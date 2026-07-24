import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '$lib/prismicio';
import { asText } from '@prismicio/client';

// Knowledge base cache — 5 Minuten TTL
let _kbCache: { text: string; at: number } | null = null;
const KB_TTL_MS = 5 * 60 * 1000;

async function getKnowledgeBase(fetchFn: typeof fetch): Promise<string> {
	const now = Date.now();
	if (_kbCache && now - _kbCache.at < KB_TTL_MS) return _kbCache.text;
	try {
		const client = createClient({ fetch: fetchFn });
		const settings = await client.getSingle('settings', { lang: '*' });
		const text = asText((settings.data as any).chat_knowledge_base ?? []);
		_kbCache = { text, at: now };
		return text;
	} catch {
		return '';
	}
}

export const prerender = false;

export async function POST({ request, fetch }) {
	const body = await request.json().catch(() => null);
	const message = body?.message;

	if (!message || typeof message !== 'string' || message.trim().length === 0) {
		return json({ error: 'Ungültige Nachricht' }, { status: 400 });
	}
	if (message.length > 1000) {
		return json({ error: 'Nachricht zu lang (max. 1000 Zeichen)' }, { status: 400 });
	}

	const apiKey = env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		return json({ error: 'Chat-Bot nicht konfiguriert (ANTHROPIC_API_KEY fehlt)' }, { status: 503 });
	}

	const basePrompt =
		env.CHAT_SYSTEM_PROMPT ??
		'Du bist ein hilfreicher Assistent. Antworte kurz und präzise auf Deutsch.';

	const knowledgeBase = await getKnowledgeBase(fetch);
	const systemPrompt = knowledgeBase
		? `${basePrompt}\n\nWISSENSBASIS:\n${knowledgeBase}`
		: basePrompt;

	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 1024,
			system: systemPrompt,
			messages: [{ role: 'user', content: message.trim() }]
		})
	});

	if (!response.ok) {
		const err = await response.text().catch(() => '');
		console.error('Anthropic API error:', response.status, err);
		return json({ error: 'Fehler beim Chat-Bot' }, { status: 500 });
	}

	const data = await response.json();
	const reply = data.content?.[0]?.text ?? '';
	return json({ reply });
}
