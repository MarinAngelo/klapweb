/**
 * Self-hosted fonts (no visitor ever contacts Google):
 * - Google: preset fonts + Prismic font documents with provider "Google" are downloaded from
 *   Google Fonts
 * - Lokal: font files uploaded to Prismic (group "Schriftdateien") are downloaded from the
 *   Prismic media library — served from our own domain (no CORS issues with fonts)
 * Output: static/fonts/<slug>.css + static/fonts/<slug>/* (generated, gitignored).
 *
 * Runs with `npm run dev` / `npm run build`. Already downloaded families are skipped
 * (static/fonts/manifest.json). Never fails the build — without network the existing
 * files stay (or the site falls back to system fonts).
 *
 * Google fonts are licensed under the SIL Open Font License → self-hosting is allowed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as prismic from '@prismicio/client';
import { PRESET_FONTS, fontSlug } from '../src/lib/fontSources.js';

const OUT = 'static/fonts';
const MANIFEST = join(OUT, 'manifest.json');
// Modern browser UA → Google answers with woff2
const UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
// Character subsets to keep (others are rarely needed on these sites)
const SUBSETS = new Set(['latin', 'latin-ext']);

const googleCssUrl = (name, spec) =>
	`https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}${spec ? `:${spec}` : ''}&display=swap`;

/** Font documents from Prismic: Google (name + variants) and Lokal (uploaded files) */
async function prismicFonts() {
	try {
		const { repositoryName } = JSON.parse(readFileSync('slicemachine.config.json', 'utf8'));
		const docs = await prismic.createClient(repositoryName).getAllByType('font');
		const google = [];
		const local = [];
		for (const d of docs) {
			const name = d.data?.name?.trim();
			if (!name) continue;
			if (d.data.provider === 'Google') google.push({ name, spec: (d.data.variants ?? '').trim() });
			if (d.data.provider === 'Lokal') {
				const files = (d.data.files ?? [])
					.filter((f) => f?.file?.url)
					.map((f) => ({
						url: f.file.url,
						fileName: f.file.name ?? '',
						weight: f.weight || '400',
						style: f.style === 'kursiv' ? 'italic' : 'normal'
					}));
				if (files.length) local.push({ name, files });
				else console.warn(`⚠ Schrift «${name}» (Lokal) hat keine Schriftdateien`);
			}
		}
		return { google, local };
	} catch {
		return { google: [], local: [] }; // no font type / no network
	}
}

const FORMATS = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };

/** Lokal: download the uploaded files and write the @font-face rules */
export async function downloadLocal(name, files) {
	const slug = fontSlug(name);
	mkdirSync(join(OUT, slug), { recursive: true });
	const rules = [];
	for (const [i, f] of files.entries()) {
		const ext = (f.fileName || f.url.split('?')[0]).split('.').pop().toLowerCase();
		const format = FORMATS[ext];
		if (!format) throw new Error(`Dateityp «.${ext}» nicht unterstützt (woff2, woff, ttf, otf)`);
		const file = `${f.weight}-${f.style}-${i}.${ext}`;
		const res = await fetch(f.url);
		if (!res.ok) throw new Error(`Download ${res.status}: ${f.fileName || f.url}`);
		writeFileSync(join(OUT, slug, file), Buffer.from(await res.arrayBuffer()));
		rules.push(
			[
				'@font-face {',
				`  font-family: '${name.replace(/'/g, "\\'")}';`,
				`  font-style: ${f.style};`,
				`  font-weight: ${f.weight};`,
				'  font-display: swap;',
				`  src: url(/fonts/${slug}/${file}) format('${format}');`,
				'}'
			].join('\n')
		);
	}
	writeFileSync(
		join(OUT, `${slug}.css`),
		`/* ${name} — Lokal (Prismic), self-hosted */\n${rules.join('\n')}\n`
	);
}

async function download(name, spec) {
	const slug = fontSlug(name);
	const res = await fetch(googleCssUrl(name, spec), { headers: { 'User-Agent': UA } });
	if (!res.ok) throw new Error(`Google Fonts ${res.status} für «${name}»`);
	const css = await res.text();

	// Blocks are preceded by a subset comment (/* latin */); keep the needed subsets
	const blocks = [...css.matchAll(/(?:\/\*\s*([\w-]+)\s*\*\/\s*)?(@font-face\s*\{[^}]*\})/g)]
		.filter(([, subset]) => !subset || SUBSETS.has(subset))
		.map(([, , block]) => block);
	if (!blocks.length) throw new Error(`keine Schriftdateien für «${name}»`);

	mkdirSync(join(OUT, slug), { recursive: true });
	const out = [];
	for (const block of blocks) {
		let local = block;
		for (const [, url] of block.matchAll(/url\((https:\/\/[^)]+)\)/g)) {
			const file = url.split('/').pop().split('?')[0];
			const target = join(OUT, slug, file);
			if (!existsSync(target)) {
				const font = await fetch(url);
				if (!font.ok) throw new Error(`Download ${font.status}: ${url}`);
				writeFileSync(target, Buffer.from(await font.arrayBuffer()));
			}
			local = local.replace(url, `/fonts/${slug}/${file}`);
		}
		out.push(local);
	}
	writeFileSync(
		join(OUT, `${slug}.css`),
		`/* ${name} — self-hosted (scripts/self-host-fonts.js) */\n${out.join('\n')}\n`
	);
}

async function main() {
	mkdirSync(OUT, { recursive: true });
	const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
	const families = new Map(Object.entries(PRESET_FONTS));
	const { google, local } = await prismicFonts();
	for (const { name, spec } of google) families.set(name, spec);

	let loaded = 0;
	// Lokal: spec = file list → re-download when files / weights change
	for (const { name, files } of local) {
		const slug = fontSlug(name);
		const spec = JSON.stringify(files.map((f) => [f.url, f.weight, f.style]));
		if (manifest[slug] === spec && existsSync(join(OUT, `${slug}.css`))) continue;
		try {
			await downloadLocal(name, files);
			manifest[slug] = spec;
			loaded++;
		} catch (e) {
			console.warn(`⚠ Schrift «${name}» (Lokal) nicht geladen: ${e.message}`);
		}
	}

	for (const [name, spec] of families) {
		const slug = fontSlug(name);
		if (manifest[slug] === spec && existsSync(join(OUT, `${slug}.css`))) continue;
		try {
			await download(name, spec);
			manifest[slug] = spec;
			loaded++;
		} catch (e) {
			console.warn(`⚠ Schrift «${name}» nicht geladen: ${e.message}`);
		}
	}
	writeFileSync(MANIFEST, JSON.stringify(manifest, null, '\t') + '\n');
	console.log(
		`✓ Schriften selbst gehostet (${families.size + local.length}${loaded ? `, ${loaded} neu geladen` : ''})`
	);
}

// Only when run as a script (the test imports downloadLocal)
if (import.meta.url === `file://${process.argv[1]}`)
	main().catch((e) => {
		console.warn(`⚠ Schriften-Download übersprungen: ${e.message}`);
	});
