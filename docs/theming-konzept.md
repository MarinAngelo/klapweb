# Theming-Konzept

Stand: März 2026

## Übersicht

Das Theming funktioniert über eine dreischichtige Architektur, die sicherstellt, dass Design-Werte aus Prismic **ohne Flash (FOUC)** und **reaktiv** in der gesamten App verfügbar sind.

```
Prismic CMS (Theme-Dokument)
          ↓
+layout.server.ts  →  locals.themeColorsCss
          ↓
hooks.server.ts    →  <html style="--page-color:#fff; ...">  (SSR, vor erstem Paint)
          ↓
theme.ts (Store)   →  initialValues liest cssVar() aus <html style>
          ↓
updateTheme()      →  füllt den Store vollständig + setzt CSS-Vars via setProperty()
          ↓
Komponenten        →  $theme.pageColor  oder  var(--page-color)
```

---

## Schicht 1 – SSR-Injection (`hooks.server.ts` + `+layout.server.ts`)

**Zweck:** Farben und Styles sind bereits im ersten HTML-Response vorhanden, bevor JavaScript lädt.

`+layout.server.ts` liest das aktive Prismic-Theme-Dokument und baut einen String aus CSS-Custom-Properties:

```
--page-color:#1a1a1a;--page-bg-color:#ffffff;--header-color:#000;...
```

Dieser String landet in `locals.themeColorsCss`. `hooks.server.ts` injiziert ihn als `style`-Attribut direkt auf das `<html>`-Element:

```html
<html style="--page-color:#1a1a1a;--page-bg-color:#ffffff;..." lang="de"></html>
```

**Warum `<html style="">`?** Inline-Styles haben die höchste CSS-Spezifizität und schlagen Stylesheets (inkl. Vite-injiziertem CSS), egal in welcher Reihenfolge der Browser sie ausführt. Eine `<style>`-Tag-Injektion im `<head>` reicht nicht aus.

### Injizierte Variablen

| Gruppe    | CSS-Variablen                                                                                                                                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seite     | `--page-color`, `--page-bg-color`, `--page-font`, `--page-link-color`, `--page-link-hover-color`, `--page-button-color`, `--page-button-bg-color`, `--page-button-hover-color`, `--page-button-hover-bg-color`, `--page-link-active-color`, `--page-link-visited-color`                        |
| Kopfzeile | `--site-title-font`, `--site-title-font-size`, `--site-sub-title-font-size`, `--header-font-size`, `--logo-height`, `--header-color`, `--header-bg-color`, `--header-link-color`, `--header-link-hover-color`, `--header-link-hover-bg-color`, `--header-link-font-size`, `--header-link-font` |
| Fußzeile  | `--footer-color`, `--footer-bg-color`, `--footer-font-size-top-bar`, `--footer-font-size-button-bar`, `--footer-link-color`, `--footer-link-hover-color`                                                                                                                                       |
| Sonstiges | `--container-max-width`, `--heading-opacity`                                                                                                                                                                                                                                                   |

---

## Schicht 2 – Svelte Store (`src/lib/stores/theme.ts`)

**Zweck:** Reaktiver Zugriff auf alle Theme-Werte aus Svelte-Komponenten.

### `THEME_DEFAULTS`

Exportiertes Objekt mit allen möglichen Theme-Feldern und ihren Fallback-Werten (leere Strings für Farben, `0` für Zahlen). Dient als Typdefinition und Initialisierungsbasis.

### `cssVar(name)`

Hilfsfunktion, die beim Store-Init CSS-Vars aus dem DOM liest:

1. Zuerst `document.documentElement.style.getPropertyValue(name)` — das ist die injizierte Inline-Deklaration aus Schicht 1
2. Fallback: `getComputedStyle(document.documentElement).getPropertyValue(name)` — aus Stylesheets

### `initialValues`

Beim Modulload (Hydration) wird der Store sofort mit den tatsächlichen Werten aus dem `<html style="">` befüllt. So hat der Store bereits beim ersten Svelte-Render die richtigen Werte — kein Flash.

### `theme`

Writable-Store, initialisiert mit `initialValues`. Nach Hydration wird er durch `updateTheme()` vervollständigt.

---

## Schicht 3 – Theme-Updater (`src/lib/utils/themeUpdater.ts`)

**Zweck:** Vollständige Befüllung des Stores und Setzen aller CSS-Vars, sobald die Prismic-Daten vollständig verfügbar sind.

`updateTheme(data)` wird in `+layout.svelte` aufgerufen:

- **synchron** (direkt im `<script>`-Block) → Store ist vor erstem Svelte-Render aktuell
- **reaktiv** via `$:` → bei jedem Routenwechsel erneut aufgerufen, falls das Theme sich ändert

`updateTheme()`:

1. Liest alle Felder aus `data.prismicTheme?.data`
2. Ruft `theme.update(...)` auf
3. Setzt alle CSS-Vars via `document.documentElement.style.setProperty()` — dieselben Vars wie in Schicht 1, plus dynamische wie `--header-bg-opacity` und Schriftart-`<link>`-Tags

---

## Zugriff in Komponenten

### Via Svelte-Store (reaktiv)

```svelte
<script>
	import { theme } from '$lib/stores/theme';
</script>

<div style="color: {$theme.pageColor}">...</div>
```

### Via CSS-Variable (direkt, FOUC-sicher)

```svelte
<div style="background-color: var(--page-bg-color);">...</div>
```

**Empfehlung für layout-kritische Styles** (Hintergrundfarben, die beim ersten Paint sichtbar sind): CSS-Vars direkt verwenden, nicht den Store. Der Store kann erst nach der JS-Hydration gelesen werden; die CSS-Var ist ab dem ersten HTML-Byte verfügbar.

---

## Seitenbezogene Farb-Überschreibungen

Einzelne Seiten können in Prismic eigene Hintergrundfarben definieren (`page_bg_color` im Page-Dokument). Diese werden in `+layout.svelte` per `document.documentElement.style.setProperty()` gesetzt und gelten dann für diese Seite. **Achtung:** Diese Überschreibungen passieren erst client-seitig — bei einem Hard-Refresh auf dieser Seite ist kurz die globale Theme-Farbe sichtbar, bevor die Seiten-Farbe übernimmt. Dieses Edge-Case ist akzeptiert (betrifft nur seitenspezifische Overrides, nicht das Basis-Theme).

---

## Dateien

| Datei                           | Rolle                                                               |
| ------------------------------- | ------------------------------------------------------------------- |
| `src/hooks.server.ts`           | Injiziert `<html style="...">` via `transformPageChunk`             |
| `src/routes/+layout.server.ts`  | Baut `locals.themeColorsCss` aus Prismic-Daten                      |
| `src/lib/stores/theme.ts`       | `THEME_DEFAULTS`, `cssVar()`, `initialValues`, `theme`-Store        |
| `src/lib/utils/themeUpdater.ts` | `updateTheme()` — vollständiger Store-Update + CSS-Var-Setter       |
| `src/routes/+layout.svelte`     | Ruft `updateTheme()` synchron + reaktiv auf                         |
| `src/app.css`                   | Verwendet CSS-Vars in globalen Regeln (Schriften, Farben, Headings) |
| `src/app.d.ts`                  | Typisierung: `App.Locals.themeColorsCss`                            |
