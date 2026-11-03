/**
 * Developer knowledge base for the chat bot (`@dev` mode, agency login only):
 * src/lib/generated/chatbot-dev-wissensbasis.md (gitignored, bundled server-side by /api/chat).
 *
 * Sources (all generated automatically, nothing written by hand):
 * - CLAUDE.md and docs/*.md (project rules and developer documentation)
 * - .env.example (variables with their comments — no values)
 * - gating.json: plans, features (plans, required env vars), admin sections
 * - env var reference: which variables are read in which files (scan of src/, netlify/, scripts/)
 * - Prismic field reference with API IDs (src/lib/generated/prismic-field-reference.json)
 *
 * npm run wissensbasis:dev   (also part of `npm run dev` / `npm run build`)
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const OUT = 'src/lib/generated/chatbot-dev-wissensbasis.md';
const REFERENCE = 'src/lib/generated/prismic-field-reference.json';
const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '');

/** All files below `dir` with one of the extensions */
function walk(dir, exts, files = []) {
	if (!existsSync(dir)) return files;
	for (const name of readdirSync(dir)) {
		if (name === 'node_modules' || name.startsWith('.') || name === 'generated') continue;
		const path = join(dir, name);
		if (statSync(path).isDirectory()) walk(path, exts, files);
		else if (exts.some((ext) => name.endsWith(ext))) files.push(path);
	}
	return files;
}

const sections = [];
const add = (title, body) => body.trim() && sections.push(`\n\n# ${title}\n\n${body.trim()}`);

// ── Project rules and docs ─────────────────────────────────────────────────────
add('Projektregeln (CLAUDE.md)', read('CLAUDE.md'));
for (const file of readdirSync('docs')
	.filter((f) => f.endsWith('.md'))
	.sort()) {
	add(`Dokumentation: docs/${file}`, read(join('docs', file)));
}

// ── Env vars ───────────────────────────────────────────────────────────────────
add(
	'Umgebungsvariablen: Vorlage .env.example (ohne Werte)',
	'```\n' + read('.env.example') + '\n```'
);

const usage = new Map();
for (const file of walk('src', ['.ts', '.js', '.svelte'])
	.concat(walk('netlify', ['.ts', '.js', '.mjs']))
	.concat(walk('scripts', ['.js']))) {
	const text = read(file);
	for (const match of text.matchAll(/\b(?:env|process\.env)\.([A-Z][A-Z0-9_]+)/g)) {
		const name = match[1];
		if (['NODE_ENV', 'DEV'].includes(name)) continue;
		if (!usage.has(name)) usage.set(name, new Set());
		usage.get(name).add(relative('.', file));
	}
}
add(
	'Umgebungsvariablen: wo sie im Code gelesen werden (automatisch gescannt)',
	[...usage.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([name, files]) => `- ${name}: ${[...files].sort().join(', ')}`)
		.join('\n')
);

// Netlify functions (scheduled jobs): their header comment documents purpose and env vars
const functionDocs = walk('netlify/functions', ['.ts', '.js', '.mjs'])
	.map((file) => {
		const header = read(file).match(/^\/\*\*([\s\S]*?)\*\//)?.[1] ?? '';
		const text = header.replace(/^\s*\* ?/gm, '').trim();
		return text ? `## ${relative('.', file)}\n${text}` : '';
	})
	.filter(Boolean);
add(
	'Netlify Functions (geplante Aufgaben, eigene Env-Vars via process.env)',
	functionDocs.join('\n\n')
);

// ── Plans and features ─────────────────────────────────────────────────────────
const gating = JSON.parse(read('gating.json') || '{}');
const planLines = Object.entries(gating.plans ?? {}).map(
	([id, p]) => `- ${id} («${p.label}»)${p.extends ? `, erweitert ${p.extends}` : ''}`
);
const featureLines = Object.entries(gating.features ?? {}).map(
	([id, f]) =>
		`- ${id} («${f.label}»): Pläne ${(f.plans ?? []).join(', ') || '–'}; Env-Vars ${(f.env ?? []).join(', ') || 'keine'}`
);
const sliceLines = Object.entries(gating.slices ?? {})
	.map(([name, s]) => {
		const parts = [];
		if (s.plan) parts.push(`Plan ${s.plan}`);
		if (s.feature) parts.push(`Feature ${s.feature}`);
		for (const [v, g] of Object.entries(s.variations ?? {}))
			parts.push(`Variante ${v}: ${g.feature ?? g.plan}`);
		for (const [f, g] of Object.entries(s.fields ?? {}))
			parts.push(`Feld ${f}: ${g.feature ?? g.plan}`);
		return parts.length ? `- ${name}: ${parts.join('; ')}` : '';
	})
	.filter(Boolean);
const adminLines = Object.entries(gating.admin_sections ?? {}).map(
	([id, a]) =>
		`- ${id} («${a.label ?? id}»): ${a.feature ?? (a.features ?? []).join(' oder ') ?? a.plan ?? 'immer'}`
);
add(
	'Pläne, Features und Gating (gating.json)',
	[
		'## Pläne (Hierarchie)',
		...planLines,
		'',
		'## Features (aktiv, wenn einer der Pläne in der Plan-Kette liegt; Env-Vars = für das Feature nötig)',
		...featureLines,
		'',
		'## Gating der Inhalts-Elemente (Slices)',
		...sliceLines,
		'',
		'## Admin-Bereiche',
		...adminLines
	].join('\n')
);

// ── Prismic field reference ────────────────────────────────────────────────────
if (existsSync(REFERENCE)) {
	const seen = new Set();
	const lines = [];
	for (const item of JSON.parse(read(REFERENCE))) {
		const key = `${item.customType}.${item.field}`;
		if (seen.has(key) || item.type === 'Slices') continue;
		seen.add(key);
		lines.push(`- ${key} (${item.type}, ${item.elementType}): «${item.label}»`);
	}
	add(
		'Prismic-Feldreferenz (API-IDs, aktueller Plan dieses Branches)',
		'Schlüssel = <Custom Type oder Slice-Ordner>.<API-ID>\n' + lines.join('\n')
	);
}

mkdirSync('src/lib/generated', { recursive: true });
const text =
	`# KLAP WEB – Entwickler-Wissensbasis\n\nAutomatisch erzeugt von scripts/chatbot-dev-wissensbasis.js am ${new Date().toISOString().slice(0, 10)}. Interne Information, nur für die Agentur.` +
	sections.join('');
writeFileSync(OUT, text);
const words = text.split(/\s+/).filter(Boolean).length;
console.log(`✓ ${OUT}: ${sections.length} Abschnitte, ca. ${words} Wörter`);
