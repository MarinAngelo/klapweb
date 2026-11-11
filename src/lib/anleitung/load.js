/**
 * Guide chapters for editors («Anleitung») — single source for the website (/anleitung on the
 * agency site, slice «Anleitung» field «Kapitel aus der Anleitung») and the chat bot knowledge
 * base (docs/chatbot-wissensbasis.html).
 *
 *   index.json          order + metadata: id, title, feature? (gating.json), stand (date the text
 *                       was last checked), sources? (paths whose changes make the text stale)
 *   kapitel/<id>.html   text (h3/p/ol/ul/li only)
 *
 * This loader reads from disk: Node scripts only. The website uses src/lib/server/anleitung.ts.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/lib/anleitung';

export { ALL_CHAPTERS } from './options.js';

/**
 * @param {string} [root]
 * @returns {{ id: string; title: string; feature?: string; stand: string; sources?: string[] }[]}
 */
export function readChapterIndex(root = process.cwd()) {
	return JSON.parse(readFileSync(join(root, DIR, 'index.json'), 'utf8'));
}

/** @param {string} id @param {string} [root] */
export function readChapterHtml(id, root = process.cwd()) {
	const file = join(root, DIR, 'kapitel', `${id}.html`);
	return existsSync(file) ? readFileSync(file, 'utf8').trim() : null;
}

/** Chapter files without an entry in index.json @param {string} [root] */
export function orphanChapterFiles(root = process.cwd()) {
	const ids = new Set(readChapterIndex(root).map((c) => c.id));
	return readdirSync(join(root, DIR, 'kapitel'))
		.filter((f) => f.endsWith('.html') && !ids.has(f.slice(0, -5)))
		.map((f) => `${DIR}/kapitel/${f}`);
}
