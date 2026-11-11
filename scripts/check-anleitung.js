/**
 * Guide chapters (src/lib/anleitung): reports chapters that may be out of date.
 *
 * A chapter is «possibly stale» when one of its `sources` (index.json) has commits newer than
 * its `stand` date. After checking/updating the text, set `stand` to today (the Claude task
 * /chatbot-wissensbasis does both). Also checks the index itself: missing files, unknown
 * features, paths that no longer exist, features without a chapter.
 *
 * node scripts/check-anleitung.js          exit 1 on findings   (npm run check:anleitung)
 * node scripts/check-anleitung.js --warn   warnings only        (npm run dev)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
	orphanChapterFiles,
	readChapterHtml,
	readChapterIndex
} from '../src/lib/anleitung/load.js';

const warnOnly = process.argv.includes('--warn');
const gating = JSON.parse(readFileSync('gating.json', 'utf8'));

const git = (...args) => {
	try {
		return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
	} catch {
		return null; // no git (e.g. deploy without history) → nothing to compare
	}
};
// Paths as written, without glob magic ([[lang=lang]] is a folder name)
const literal = (paths) => paths.map((p) => `:(literal)${p}`);

const chapters = readChapterIndex();
const problems = [];
const stale = [];

const seen = new Set();
for (const c of chapters) {
	for (const key of [c.id, c.title]) {
		if (seen.has(key))
			problems.push(`«${key}» kommt mehrfach vor (id und Titel müssen eindeutig sein)`);
		seen.add(key);
	}
	if (!readChapterHtml(c.id))
		problems.push(`${c.id}: Datei kapitel/${c.id}.html fehlt oder ist leer`);
	for (const feature of [c.feature, ...(c.covers ?? [])].filter(Boolean)) {
		if (!gating.features?.[feature])
			problems.push(`${c.id}: Feature «${feature}» gibt es in gating.json nicht`);
	}
	if (!/^\d{4}-\d\d-\d\d$/.test(c.stand ?? '')) {
		problems.push(`${c.id}: «stand» fehlt (Datum JJJJ-MM-TT)`);
		continue;
	}
	const sources = c.sources ?? [];
	for (const source of sources) {
		if (git('ls-files', '--', ...literal([source])) === '') {
			problems.push(`${c.id}: Quelle «${source}» gibt es nicht mehr`);
		}
	}
	if (sources.length === 0) continue;
	const log = git(
		'log',
		'--no-merges',
		`--since=${c.stand} 23:59:59`,
		'--format=%cs %s',
		'--',
		...literal(sources)
	);
	const commits = (log ?? '').split('\n').filter(Boolean);
	if (commits.length) stale.push({ chapter: c, commits });
}

for (const file of orphanChapterFiles()) problems.push(`${file}: kein Eintrag in index.json`);

const documented = new Set(chapters.flatMap((c) => [c.feature, ...(c.covers ?? [])]));
const undocumented = Object.entries(gating.features ?? {})
	.filter(([id]) => !documented.has(id))
	.map(([, def]) => def.label);

if (problems.length) {
	console.warn(`⚠ Anleitung (src/lib/anleitung/index.json): ${problems.length} Fehler`);
	for (const p of problems) console.warn(`  → ${p}`);
}
if (stale.length) {
	console.warn(
		`⚠ Anleitung: ${stale.length} Kapitel evtl. veraltet (Code seit «stand» geändert) — Text prüfen, dann «stand» setzen (/chatbot-wissensbasis)`
	);
	if (warnOnly) {
		// npm run dev: one line; details with «npm run check:anleitung»
		console.warn(`  → ${stale.map(({ chapter }) => chapter.title).join(' · ')}`);
		console.warn('  Details: npm run check:anleitung');
	} else {
		for (const { chapter, commits } of stale) {
			console.warn(
				`  → ${chapter.title} (Stand ${chapter.stand}): ${commits.length} Commits, zuletzt «${commits[0]}»`
			);
		}
	}
}
if (undocumented.length) {
	console.warn(`⚠ Anleitung: kein Kapitel für die Funktionen ${undocumented.join(', ')}`);
}
if (!problems.length && !stale.length && !undocumented.length) {
	console.log(`✓ Anleitung: ${chapters.length} Kapitel aktuell`);
}
if (!warnOnly && (problems.length || stale.length)) process.exit(1);
