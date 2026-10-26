/**
 * Mehrsprachigkeit: Jede statisch generierte Seite braucht eine Übersetzung in allen
 * Sprachen des Prismic-Repos. Sonst liefert z.B. /en-us/ressource/<uid> einen 404.
 *
 * Prüft die Dokumenttypen in TRANSLATED_TYPES (Routen mit entries()/prerender) und listet
 * Dokumente der Hauptsprache, denen Übersetzungen fehlen. Läuft bei `npm run dev` und
 * `npm run build` mit — warnt nur, bricht nie ab (auch nicht ohne Netzwerk).
 *
 * Manuell: npm run check:translations   (Exit-Code 1 bei fehlenden Übersetzungen)
 */
import { readFileSync } from 'node:fs';
import * as prismic from '@prismicio/client';

// Custom types rendered as their own (static) pages — keep in sync with the routes
const TRANSLATED_TYPES = ['page', 'leistung', 'ressource'];

const strict = process.argv.includes('--strict');

async function main() {
	const { repositoryName } = JSON.parse(readFileSync('slicemachine.config.json', 'utf8'));
	const client = prismic.createClient(repositoryName);

	const repo = await client.getRepository();
	const langs = repo.languages.map((l) => l.id);
	if (langs.length < 2) return 0; // single language → nothing to check
	const master = repo.languages.find((l) => l.is_master)?.id ?? langs[0];

	const missing = [];
	for (const type of TRANSLATED_TYPES) {
		let docs;
		try {
			docs = await client.getAllByType(type, { lang: '*' });
		} catch {
			continue; // type not in this repository (feature inactive)
		}
		for (const doc of docs.filter((d) => d.lang === master)) {
			const translated = new Set([doc.lang, ...doc.alternate_languages.map((a) => a.lang)]);
			const lacking = langs.filter((l) => !translated.has(l));
			if (lacking.length) missing.push({ type, uid: doc.uid ?? doc.id, lacking });
		}
	}

	if (missing.length === 0) {
		console.log(`✓ Übersetzungen vollständig (${langs.join(', ')})`);
		return 0;
	}

	console.warn(
		`⚠ ${missing.length} Seite(n) ohne vollständige Übersetzung — Mehrsprachigkeit aktiv (${langs.join(', ')}):`
	);
	for (const m of missing) {
		console.warn(`  → ${m.type}/${m.uid}: fehlt ${m.lacking.join(', ')}`);
	}
	console.warn(
		'  In Prismic: Dokument öffnen → Sprache wählen → «Create translation» → veröffentlichen.'
	);
	return strict ? 1 : 0;
}

main()
	.then((code) => process.exit(code))
	.catch((e) => {
		// Never block dev/build because Prismic is unreachable
		console.warn(`⚠ Übersetzungs-Prüfung übersprungen: ${e.message}`);
		process.exit(0);
	});
