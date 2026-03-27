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
- **Prismic API-IDs immer auf Englisch** (`snake_case`), Labels immer auf Deutsch
  - Richtig: `section_border`, `mobile_full_width`, `search_enabled`
  - Falsch: `sektion_rahmen`, `mobile_vollbreite`, `mit_suche`
  - **Achtung:** API-ID nur umbenennen wenn das Feld noch keinen Inhalt hat — sonst gehen Daten verloren
- TypeScript-Casts (`as any`) nie im Svelte-Template — immer im `<script>`-Block
- Scroll-Animationen: kein reaktiver State, nur `bind:this` + direktes `element.style` im RAF
- Heading-Tags (`h1`–`h4`) haben globale Grössen in `app.css` — nie mit `text-*`-Klassen überschreiben
- CSS-Variablen (`--header-color` etc.) können leer sein → Store-Werte bevorzugen

## i18n

- **Niemals UI-Text hardcodieren** — jeden sichtbaren String über den `$_`-Store ausgeben
- Import im Template: `import { _ } from '$lib/stores/i18n'` → Verwendung: `{$_('Schlüssel')}`
- Neuen Key zuerst in `src/lib/i18n/translations.ts` eintragen (Key = deutscher Text, mind. `de-ch` + `en-us`)
- Gilt auch für interne Tools wie den Katalog

## Netlify Blobs

- Package `@netlify/blobs` v10: Auto-Detection funktioniert nicht mit `adapter-auto`
- `siteID` + `token` immer explizit via `$env/dynamic/private` übergeben (nie `process.env`)

## Feature-Flag-System

### Übersicht

| Datei                          | Zweck                                                        | Committed |
| ------------------------------ | ------------------------------------------------------------ | --------- |
| `gating.json`                  | Einzige Konfigurationsquelle: Pläne, Features, Gating-Regeln | Ja        |
| `slicemachine.config.json`     | Wählt den aktiven Plan (`"plan": "starter"`)                 | Ja        |
| `scripts/build-customtypes.js` | Liest `gating.json` + `base.json` → generiert Output         | Ja        |
| `src/lib/slices/*/base.json`   | Slice-Quelldatei (kein `_meta` mehr nötig)                   | Ja        |
| `src/lib/slices/*/full.json`   | Slice mit Extra-Variationen (für Features)                   | Ja        |
| `src/lib/slices/*/model.json`  | Generiert — gitignored                                       | Nein      |
| `customtypes/*/index.json`     | Generiert — gitignored                                       | Nein      |

### gating.json — Struktur

```json
{
	"plans": {
		"starter": { "label": "Basis" },
		"professional": { "label": "Professionell", "extends": "starter" },
		"individuell": { "label": "Individuell", "extends": "professional" }
	},
	"features": {
		"ecommerce": { "label": "E-Commerce", "plans": ["individuell"] }
	},
	"customTypes": {
		"leistung": { "feature": "ecommerce" }
	},
	"slices": {
		"Akkordeon": {
			"plan": "professional", // Slice-Ebene: ganzer Slice gesperrt
			"fields": {
				"mit_suche": { "plan": "professional" } // Feld-Ebene
			},
			"variations": {
				"leistungen": { "feature": "ecommerce" } // Variations-Ebene
			}
		}
	}
}
```

### Plan-Hierarchie & Features

- Pläne sind hierarchisch via `extends`: `individuell → professional → starter`
- `activePlanChain` = aktueller Plan + alle Eltern, z.B. `["individuell", "professional", "starter"]`
- Ein Feature ist aktiv wenn mindestens ein Eintrag aus `feature.plans` in `activePlanChain` vorkommt
- **Gating-Regel**: `{ plan: "professional" }` → aktiv bei professional + individuell (nicht starter)

### Gating-Ebenen in gating.json.slices

| Ebene     | Schlüssel                                    | Effekt wenn inaktiv                       |
| --------- | -------------------------------------------- | ----------------------------------------- |
| Slice     | direkt `plan`/`feature` auf dem Slice-Objekt | `model.json` wird nicht generiert         |
| Variation | `variations.{id}.plan/feature`               | Variation erscheint nicht in `model.json` |
| Feld      | `fields.{key}.plan/feature`                  | Feld fehlt in allen Variationen           |

### Variationen aus full.json

Extra-Variationen (die nicht in `base.json` stehen) werden in `full.json` definiert.
`gating.json slices.{Name}.variations` steuert welche davon aktiv sind — ersetzt die alten `customtypes/_features/*/slices.json`.

### Tab-Overlays für Custom Types (page/settings)

Inhalt bleibt in `customtypes/_features/{feature}/page.json` bzw. `settings.json`.
Aktiv wenn das Feature aktiv ist — keine Deklaration in `gating.json` nötig.

### Workflow bei Planänderung

1. `slicemachine.config.json` → `plan` ändern
2. `npm run dev` → Script generiert neue `model.json` + `index.json`
3. `git diff` → `slicemachine.config.json` + evtl. `full.json` committen
4. `slicemachine push`

### Neuen Slice erstellen und allen Branches verfügbar machen

1. Slice via Slice Machine UI erstellen
2. In Slice Machine UI den Slice der Page-Slice-Zone zuweisen (Custom Type → Page → Slices → Add)
3. **`customtypes/page/base.json` manuell ergänzen** — das ist der entscheidende Schritt:
   ```json
   "slices": { "config": { "choices": {
     "mein_neuer_slice": { "type": "SharedSlice" }
   }}}
   ```
4. Alles committen: `src/lib/slices/NeuerSlice/` + `customtypes/page/base.json`
5. `slicemachine push`
6. Branch in andere Branches mergen → `base.json` bringt den Eintrag automatisch mit

**Warum:** `customtypes/page/index.json` ist gitignored (generiert). Die Slice Machine UI schreibt nur dort hin. Nur `base.json` ist versioniert und damit branch-übergreifend gültig.

**Frühwarnung:** `npm run dev` warnt automatisch wenn `index.json` Slices enthält, die in `base.json` fehlen:

```
⚠ page/base.json fehlen Slice-Choices, die in index.json vorhanden sind: → mein_neuer_slice
```
