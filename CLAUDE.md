# Claude Code – Projektregeln

## Verhalten

- Dateien direkt ändern oder erstellen ohne vorher zu fragen
- Antworten auf Deutsch, kurz und direkt
- Keine Zusammenfassungen am Ende einer Antwort

## Stack

- SvelteKit, Prismic Slice Machine, Tailwind CSS
- Slices in `src/lib/slices/*/index.svelte` + `model.json`
- CMS-Sprache Deutsch

## Wichtige Konventionen

- JS/TS-Variablen immer auf Englisch
- TypeScript-Casts (`as any`) nie im Svelte-Template — immer im `<script>`-Block
- Scroll-Animationen: kein reaktiver State, nur `bind:this` + direktes `element.style` im RAF
- Heading-Tags (`h1`–`h4`) haben globale Grössen in `app.css` — nie mit `text-*`-Klassen überschreiben
- CSS-Variablen (`--header-color` etc.) können leer sein → Store-Werte bevorzugen

## Netlify Blobs

- Package `@netlify/blobs` v10: Auto-Detection funktioniert nicht mit `adapter-auto`
- `siteID` + `token` immer explizit via `$env/dynamic/private` übergeben (nie `process.env`)

## Feature-Flag-System

- `slicemachine.config.json` → `plan` bestimmt aktive Features
- `scripts/build-customtypes.js` läuft bei `dev` + `build` und generiert `model.json` + Custom Type `index.json`
- `model.json` und `customtypes/*/index.json` sind gitignored (generiert)
