---
name: Slice-Entwicklung
description: 'Use when: a new Prismic slice has to be implemented, a slice variation must be added, or an existing slice needs to match the project structure for SvelteKit content, responsive design, and theme-aware styling.'
---

# Slice-Entwicklung

## Ziel

Prismic-Slices in diesem Projekt sauber, konsistent und wiederverwendbar bauen, damit sie in der CMS-Struktur, im Frontend und im Designsystem korrekt funktionieren.

## Grundprinzip

Vor der Umsetzung eines Slices immer prüfen:

1. Gibt es bereits einen sehr ähnlichen Slice oder ein vergleichbares Muster?
2. Welcher Teil ist CMS-Content, welcher Teil UI-Logik und welcher Teil allgemeines Layout?
3. Welche Felder und Variationen werden im Prismic-Model gebraucht?
4. Wo gehört der Slice hin: `src/lib/slices/<SliceName>/` mit `index.svelte` und `model.json`?

## Ablauf

### 1. Vorbild suchen

- Vor dem Erstellen eines neuen Slices ähnliche Slices im Ordner `src/lib/slices/` vergleichen.
- Bei komplexen Layouts Muster wie `TextMitBild`, `Kacheln`, `Titelbereich`, `ZweiSpalten` oder `Galerie` verwenden.
- Bei Formular-, Button- und Bild-Patterns die jeweiligen Basiskomponenten und vorhandenen Slice-Strukturen prüfen.

### 2. Slice-Struktur sauber aufbauen

Ein Slice sollte in der Regel die folgenden Bestandteile haben:

- `index.svelte` für die Render-Logik
- `model.json` bzw. die passende Slice-Definition im Prismic-Setup
- ggf. Hilfs-Komponenten oder lokale Sub-Elemente, wenn nötig

Entscheidung:

- Wenn die Logik nur innerhalb dieses Slice genutzt wird, lokal halten.
- Wenn das Pattern mehrfach gebraucht wird, in `src/lib/components/` auslagern.

### 3. Datenfluss definieren

- Prismic-Felder über `slice.primary` bzw. `slice.items` lesen.
- Theme- und Store-Werte über `theme` oder bestehende Store-Patterns konsumieren.
- Keine festen Farbwerte oder unflexible Layout-Settings ohne Theme-Integration verwenden.
- Für sichtbare Texte immer `t()` oder `$_`-Strings verwenden, wenn sie im Frontend sichtbar sind.

### 4. Styling nach Projektkonventionen

- Tailwind für das Layout, responsive Verhaltensweisen und Abstände nutzen.
- Theme-Werte via CSS-Variablen oder Store-Variablen verwenden.
- Layout- und Typografie-Regeln aus vorhandenen Slices übernehmen.
- Keine ad-hoc Klassen- oder Farb-Overrides einführen, wenn es bereits ein Muster im Projekt gibt.
- Bei Inputs, Selects und ähnlichen Formular-Komponenten das bestehende Projektpattern beachten.

### 5. Responsive und CMS-tauglich bauen

- Mobile-/Desktop-Verhalten bewusst getrennt umsetzen, wenn das Slice verschiedene Layoutversionen braucht.
- CMS-Felder in Prismic mit verständlichen deutschen Labels und englischen API-IDs anlegen.
- Für Bildgrößen und responsives Verhalten die bestehenden Image-Wrapper und `sizes`-Muster verwenden.
- Slices so bauen, dass sie in beliebigen Inhalts- und Layout-Kontexten stabil wirken.

### 6. Qualitätskontrolle

Vor dem Abschluss prüfen:

- Ist der Slice mit bestehenden Slices konsistent?
- Funktioniert er mit den vorhandenen Prismic-Strukturen?
- Gibt es bereits gleiche oder ähnliche Variationen im Projekt?
- Sind alle Titel, Labels und sichtbaren Texte internationalisiert?
- Behält der Slice das Theme- und Farbdesign des Projekts ein?
- Ist das Layout auch auf Mobilgeräten sauber?
- Verwendet der Slice keine unnötige SSR- oder Browser-Logik?

## Entscheidungslogik

### Wenn der Slice...

- nur für eine spezielle Seite gebaut wird -> möglichst einfach und lokal halten
- global wiederverwendbar ist -> in den allgemeinen Slice-Ordner `/src/lib/slices/` stellen
- mehrere Varianten braucht -> zusätzliche Variation oder lokale Bedingungen sauber modellieren
- mit Theme oder globalem Styling arbeitet -> bestehende Store- und CSS-Variable-Konventionen nutzen
- Text- oder UI-Strings enthält -> i18n/Übersetzung prüfen

## Projektmuster

Wichtige Referenzen:

- `src/lib/slices/TextMitBild/`
- `src/lib/slices/Kacheln/`
- `src/lib/slices/Titelbereich/`
- `src/lib/slices/ZweiSpalten/`
- `src/lib/components/InputField.svelte`
- `src/lib/stores/theme.ts`
- `src/lib/i18n/`

## Abschlusskriterien

Ein Slice gilt als fertig, wenn er:

- in die bestehende Slice-Architektur passt,
- die vorhandenen Prismic-, Theme- und Styling-Konventionen beachtet,
- responsiv und CMS-geeignet arbeitet,
- keine unübersetzten UI-Texte enthält,
- und kaum bis keine doppelte Logik mit bereits bestehenden Slices aufweist.

## Beispiel-Trigger

- “Baue einen neuen Slice für eine 3-Spalten-Übersicht mit Prismic-Feldern.”
- “Erstelle eine Slice-Variation für eine Alternativversion mit Bild links statt rechts.”
- “Refaktoriere diesen Slice nach den vorhandenen Projektmustern im Bereich TextMitBild und Kacheln.”
- “Prüfe, ob dieser Slice bereits ein ähnliches Layout im Projekt hat.”
