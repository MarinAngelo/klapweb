import type { Client } from '@prismicio/client';

/**
 * Prerender entries: the main language has no URL prefix (/uid, not /de-ch/uid).
 * Generating it with prefix as well would create duplicate pages (and dead links from them).
 */
export async function getMainLang(client: Client): Promise<string> {
	const repo = await client.getRepository();
	return repo.languages.find((l) => l.is_master)?.id ?? repo.languages[0]?.id ?? '';
}

/** `lang` route param for an entry — omitted for the main language */
export function langParam(lang: string, mainLang: string): { lang?: string } {
	return lang === mainLang ? {} : { lang };
}
