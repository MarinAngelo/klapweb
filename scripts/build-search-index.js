/**
 * Website search (feature `suche`; for the planned magnifier in the navigation — the Schaltfläche
 * variation «Suche» searches only the current page and needs no index): builds the Pagefind index
 * from the prerendered pages in build/ → build/pagefind/ (served as static files, search runs
 * in the browser — no server, no third party).
 *
 * Runs after `vite build`. Skipped when the variation is not part of the active plan
 * (generated Button model without «suche» → plan/feature/overrides already resolved).
 * Indexed: only elements with data-pagefind-body (main content in +layout.svelte); one index
 * per <html lang>.
 */
import { existsSync, readFileSync } from 'node:fs';

const MODEL = 'src/lib/slices/Button/model.json';
const SITE = 'build';

const active =
	existsSync(MODEL) &&
	(JSON.parse(readFileSync(MODEL, 'utf8')).variations ?? []).some((v) => v.id === 'suche');

if (!active) {
	console.log('Website-Suche nicht aktiv → kein Suchindex');
	process.exit(0);
}
if (!existsSync(SITE)) {
	console.warn(`⚠ ${SITE}/ fehlt — Suchindex nicht erzeugt (zuerst vite build)`);
	process.exit(0);
}

const pagefind = await import('pagefind');
const { index, errors: createErrors } = await pagefind.createIndex({});
if (!index) {
	console.error('✗ Pagefind:', createErrors);
	process.exit(1);
}
const { errors, page_count } = await index.addDirectory({ path: SITE });
if (errors.length) console.warn('⚠ Pagefind:', errors);
await index.writeFiles({ outputPath: `${SITE}/pagefind` });
await pagefind.close();
console.log(`✓ Suchindex: ${page_count} Seiten → ${SITE}/pagefind`);
