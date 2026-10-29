/**
 * Inhalts-Prüfung im Terminal (dieselbe Prüfung zeigt /admin/inhalte für Redakteure):
 *
 * - Mehrsprachigkeit: Jede statisch generierte Seite (TRANSLATED_TYPES) braucht eine
 *   Übersetzung in allen Sprachen des Prismic-Repos, sonst 404 unter /en-us/…
 * - Links (alle Dokumente und Sprachen):
 *   - Web-Links ohne führenden "/" (z.B. "en-us/links") → relativ, führen ins Leere
 *   - Links in einer Übersetzung auf die Hauptsprache, obwohl das Ziel übersetzt ist
 *
 * Läuft bei `npm run dev` und `npm run build` mit — warnt nur, bricht nie ab (auch nicht
 * ohne Netzwerk). Manuell: npm run check:translations (Exit-Code 1 bei Problemen)
 *
 * Logik: src/lib/contentCheck.js
 */
import { readFileSync } from 'node:fs';
import * as prismic from '@prismicio/client';
import { checkContent } from '../src/lib/contentCheck.js';

const strict = process.argv.includes('--strict');

async function main() {
	const { repositoryName } = JSON.parse(readFileSync('slicemachine.config.json', 'utf8'));
	const { langs, master, missing, links } = await checkContent(
		prismic.createClient(repositoryName)
	);

	if (links.length) {
		console.warn(`⚠ ${links.length} Link-/Token-Problem(e) in Prismic:`);
		for (const p of links) {
			const where = `${p.doc.type}/${p.doc.uid ?? p.doc.id} (${p.doc.lang})`;
			console.warn(
				p.kind === 'relative'
					? `  → ${where}: Web-Link ohne "/" am Anfang → "${p.url}"`
					: p.kind === 'unknown_token'
						? `  → ${where}: unbekannter Token ${p.token}${p.suggestion ? ` — meintest du ${p.suggestion}?` : ''}`
						: `  → ${where}: verlinkt ${p.target}, Übersetzung vorhanden → ${p.suggestion} wählen`
			);
		}
	} else {
		console.log('✓ Links in Ordnung');
	}

	if (langs.length < 2) return strict && links.length ? 1 : 0;

	if (missing.length) {
		console.warn(
			`⚠ ${missing.length} Seite(n) ohne vollständige Übersetzung — Mehrsprachigkeit aktiv (${langs.join(', ')}):`
		);
		for (const m of missing) {
			console.warn(`  → ${m.doc.type}/${m.doc.uid ?? m.doc.id}: fehlt ${m.lacking.join(', ')}`);
		}
		console.warn(
			`  In Prismic: Dokument (${master}) öffnen → Sprache wählen → «Create translation» → veröffentlichen.`
		);
	} else {
		console.log(`✓ Übersetzungen vollständig (${langs.join(', ')})`);
	}

	return strict && (missing.length || links.length) ? 1 : 0;
}

main()
	.then((code) => process.exit(code))
	.catch((e) => {
		// Never block dev/build because Prismic is unreachable
		console.warn(`⚠ Inhalts-Prüfung übersprungen: ${e.message}`);
		process.exit(0);
	});
