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
import { existsSync, readFileSync } from 'node:fs';
import {
	orphanChapterFiles,
	readChapterHtml,
	readChapterIndex
} from '../src/lib/anleitung/load.js';
import { fieldLookup, fieldRefs } from '../src/lib/anleitung/fields.js';

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

// Field references (data-field) can only be checked where every feature is active (klap-web-ch):
// elsewhere the generated field reference lacks the fields of the other features
const REFERENCE = 'src/lib/generated/prismic-field-reference.json';
const config = JSON.parse(readFileSync('slicemachine.config.json', 'utf8'));
const planChain = [];
for (let plan = config.plan || 'basis'; plan; plan = gating.plans?.[plan]?.extends)
	planChain.push(plan);
const allFeaturesActive = Object.entries(gating.features ?? {}).every(
	([id, def]) =>
		!(config.featuresDisabled ?? []).includes(id) &&
		((def.plans ?? []).some((p) => planChain.includes(p)) || (config.features ?? []).includes(id))
);
const lookup =
	allFeaturesActive && existsSync(REFERENCE)
		? fieldLookup(
				JSON.parse(readFileSync(REFERENCE, 'utf8')),
				JSON.parse(readFileSync('src/lib/fieldDescriptions.json', 'utf8'))
			)
		: null;
const withoutDescription = new Set();
const problems = [];
const stale = [];

const seen = new Set();
for (const c of chapters) {
	for (const key of [c.id, c.title]) {
		if (seen.has(key))
			problems.push(`«${key}» kommt mehrfach vor (id und Titel müssen eindeutig sein)`);
		seen.add(key);
	}
	if (lookup) {
		for (const key of new Set(fieldRefs(readChapterHtml(c.id) ?? ''))) {
			const field = lookup(key);
			if (!field) problems.push(`${c.id}: Feld «${key}» gibt es nicht (mehr)`);
			else if (!field.text) withoutDescription.add(`${key} («${field.label}»)`);
		}
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
// Not an error: the field appears with its label only until a description is written
if (withoutDescription.size && !warnOnly) {
	console.warn(
		`ℹ Anleitung: ${withoutDescription.size} Felder ohne Beschreibung (erscheinen nur mit Namen; /field-description):`
	);
	for (const f of withoutDescription) console.warn(`  → ${f}`);
}
if (!problems.length && !stale.length && !undocumented.length) {
	console.log(`✓ Anleitung: ${chapters.length} Kapitel aktuell`);
}
if (!warnOnly && (problems.length || stale.length)) process.exit(1);
