/**
 * Findet i18n-Schlüssel, die im Code verwendet werden ($_('…'), t('…', lang)),
 * aber in src/lib/i18n/translations.ts fehlen → würden auf Deutsch angezeigt.
 *
 * npm run check:i18n   (Exit-Code 1 bei fehlenden Schlüsseln)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src';
const translations = readFileSync('src/lib/i18n/translations.ts', 'utf8');
const known = new Set(
	[...translations.matchAll(/^\t(?:'((?:[^'\\]|\\.)*)'|"([^"]*)"|([\wÄÖÜäöüß]+))\s*:\s*\{/gm)].map(
		(m) => (m[1] ?? m[2] ?? m[3]).replace(/\\'/g, "'")
	)
);

function* files(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) yield* files(p);
		else if (/\.(svelte|ts)$/.test(name) && !p.endsWith('translations.ts')) yield p;
	}
}

// Not after '&#123;' (escaped examples in the docs page)
const CALL = /(?<!&#123;)(?:\$_|\bt)\(\s*'((?:[^'\\]|\\.)+)'/g;
const missing = new Map();
for (const file of files(SRC)) {
	const src = readFileSync(file, 'utf8');
	for (const m of src.matchAll(CALL)) {
		const key = m[1].replace(/\\'/g, "'");
		if (known.has(key)) continue;
		const line = src.slice(0, m.index).split('\n').length;
		if (!missing.has(key)) missing.set(key, []);
		missing.get(key).push(`${file}:${line}`);
	}
}

if (missing.size === 0) {
	console.log('✓ Alle i18n-Schlüssel vorhanden');
	process.exit(0);
}
console.warn(`⚠ ${missing.size} i18n-Schlüssel fehlen in translations.ts:`);
for (const [key, where] of missing)
	console.warn(`  → "${key}"  (${where[0]}${where.length > 1 ? ` +${where.length - 1}` : ''})`);
process.exit(process.argv.includes('--warn') ? 0 : 1);
