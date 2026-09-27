---
name: Komponentanaufbau
description: 'Use when: a new Svelte component or reusable UI block must be created in this project, an existing component needs to be refactored, or the implementation must match established project conventions for layout, theming, and Prismic data flow.'
---

# Komponentanaufbau

## Ziel

Neue UI-Komponenten in diesem Projekt konsistent, wiederverwendbar und sauber mit den vorhandenen SvelteKit-, Tailwind- und Prismic-Konventionen bauen.

## Grundprinzip

Vor dem Schreiben neuer Logik immer erst prüfen:

1. Gibt es bereits eine ähnliche Komponente oder ein Projekt-Pattern?
2. Ist die Komponente global wiederverwendbar oder nur slice-/seiten-spezifisch?
3. Werden Theme-, i18n- oder Prismic-Daten über Stores/Props geliefert?
4. Welche Stelle ist nach Projektstruktur korrekt: `src/lib/components/`, `src/lib/slices/...` oder `src/lib/utils/`?

## Ablauf

### 1. Ausgangslage prüfen

- Relevante bestehende Komponenten suchen, bevor neue Implementierung entsteht.
- Bei Form-/Input-Elementen immer zuerst `src/lib/components/InputField.svelte` als Referenz lesen.
- Wenn die Komponente ähnlich zu einer vorhandenen UI-Elemente-Klasse ist, deren Struktur, Benamung und Styling nachbauen.

### 2. Einordnung der Komponente

- Wiederverwendbare UI-Blöcke: `src/lib/components/`
- Slice-spezifische Module: `src/lib/slices/<SliceName>/`
- Allgemeine HTML-/Style-Helfer: `src/lib/utils/`
- Theme-/State-/i18n-Logik: `src/lib/stores/` und `src/lib/i18n/`

Entscheidung:

- Wenn etwas direkt mit Prismic-Slice-Daten arbeitet, gehört es meist in den Slice-Ordner.
- Wenn es wiederverwendbar und unabhängig ist, gehört es in die globale Komponenten-Struktur.

### 3. Datenfluss definieren

- Props für lokale Präsentationslogik verwenden.
- Theme-Daten über den Store `theme` lesen, nicht lokal hardcodieren.
- Für Server-/SSR-Kontext immer sicherstellen, dass keine Browser-APIs direkt auf Server-Seiten ausgeführt werden.
- Für sichtbare Texte niemals hartcodierte Strings verwenden; i18n-Keys und `$_`-Store nutzen.

### 4. Styling nach Projektkonventionen

- Tailwind für Grundlayout und responsive Verhalten verwenden.
- CSS-Variablen und Theme-Farben bevorzugen statt fester Farbwerte.
- Input-/Select-/Textarea-Styling nur nach vorhandenen Mustern ausrichten.
- Für mehrere gleichrangige Form-Controls mit gemeinsamem Label-/Abstandsaufbau `src/lib/components/FieldGroup.svelte` verwenden; keine individuellen Margin-Korrekturen pro Feld erfinden.
- Alle benutzereingaberelevanten HTML5-Formularfelder (`text`, `search`, `email`, `tel`, `url`, `number`, `date`, `time`, `password`, `checkbox`, `radio`, `select` und `textarea`) müssen über `src/lib/components/InputField.svelte` definiert und verwendet werden. Neue direkte `<input>`, `<select>` oder `<textarea>`-Elemente sind dafür nicht zulässig.
- `InputField.svelte` ist die zentrale Abbildung der HTML5-Feldtypen und ihrer Projektstile. Wird ein HTML5-Typ benötigt, der noch nicht unterstützt wird, wird zuerst `InputField.svelte` erweitert und erst danach die aufrufende Komponente angepasst.
- Direkte Controls sind nur für technische Sonderfälle zulässig, die kein normales Formularfeld sind, etwa `type="hidden"`, Datei-Uploads mit `FileField.svelte`, native Farb-/Studio-Controls oder interne nicht-redaktionelle Steuerungen. Solche Ausnahmen müssen aus dem Kontext ersichtlich sein.
- `border-b` statt `border` verwenden, wenn das Projekt dafür konventionell ist.
- `background-color: var(--page-bg-color)` und `color: var(--page-color)` einhalten, sofern die Komponente in das Designsystem passt.
- Seiten- und komponentenspezifische Selektoren (z. B. `.field-reference-header` oder `.table-header`) gehören in den lokalen `<style>`-Block der jeweiligen Svelte-Komponente, nicht in `src/app.css`.
- `src/app.css` ist für globale, wiederverwendbare Regeln und Designsystem-Basisstile zu verwenden. Für Tabellen sind die globalen Klassen `.table-wrapper`, `.table`, `.table-header`, `.table-cell`, `.table-row`, `.table-empty` und `.table-code` zu bevorzugen.
- Lokale Tabellenvarianten dürfen diese globalen Klassen ergänzen, sollen aber keine vollständige Tabellenbasis duplizieren.

### 5. Implementierung sauber halten

- Kleine, fokussierte Komponenten bauen.
- Wiederkehrende Logik in Hilfsfunktionen und Utils auslagern.
- Keine ad-hoc Styling-Regeln außerhalb des etablierten Patterns einführen.
- Bei Textformatierung, Richtext und Bild-Handling die vorhandenen Wrapper-Komponenten verwenden.

### 6. Qualitätskontrolle

Vor Abschluss prüfen:

- Ist der Aufbau zu einer bestehenden Komponente konsistent?
- Bestehen bereits ähnliche Implementierungen im Projekt?
- Sind alle sichtbaren Strings übersetzt?
- Werden Theme- und Store-Werte korrekt verwendet?
- Ist die Komponente für mobile und desktop passend aufgebaut?
- Wird keine unnötige SSR- oder Browser-Logik eingeführt?

## Entscheidungslogik

### Wenn die Komponente...

- nur ein UI-Element für mehrere Seiten ist -> in `src/lib/components/`
- direkt zu einem Prismic-Slice gehört -> in `src/lib/slices/<SliceName>/`
- nur eine kleine Hilfsfunktion ist -> in `src/lib/utils/`
- einen globalen Zustand oder Theme-Daten nutzt -> Store oder Theme-Integration prüfen
- sichtbare Benutzertexte enthält -> i18n prüfen und `$_` verwenden

## Projekt-Referenzen

Wichtige Musterdaten:

- `src/lib/components/InputField.svelte`
- `src/lib/stores/theme.ts`
- `src/lib/i18n/`
- `src/lib/utils/`
- `src/lib/slices/`

## Abschlusskriterien

Eine Komponente gilt als fertig, wenn sie:

- zur vorhandenen Architektureinteilung passt,
- das Theme- und Designsystem beachtet,
- keine hartcodierten UI-Strings mehr enthält,
- mit ähnlichen Projektkomponenten konsistent ist,
- und ohne unnötige Speziallogik in das bestehende System integriert wurde.

## Beispiel-Trigger

- "Baue eine neue Card-Komponente mit Theme-Farben und responsivem Layout."
- "Erstelle einen Slice für ein Bild-Text-Layout mit Prismic-Feldern."
- "Refaktoriere diese Form und nutze das vorhandene Input-Pattern aus dem Projekt."
- "Prüfe, ob diese neue Komponente in src/lib/components/ oder im Slice-Ordner gehört."
