# Fullscreen-Layout von TextMitBild

## Problem

Bei der Fullscreen-Variante von `TextMitBild` war der Text trotz `justify-center` nicht korrekt auf der Bildschirmmitte ausgerichtet. Zusaetzlich lag die Bildkante leicht neben der vertikalen Mittellinie und das Bild war dadurch optisch breiter als die erlaubte rechte Haelfte.

Der Fehler war nicht ein einzelner fehlender Tailwind-Kurs, sondern eine Kombination aus mehreren Layout-Ebenen:

1. Der Fullscreen-Abschnitt wird mit `calc(100dvh - headerHeight)` unterhalb des Headers angelegt.
2. Der innere `flex-1`-Container von `Bounded` hatte standardmaessig `min-height: auto`. Die intrinsische Bildhoehe konnte deshalb das Grid auf etwa `804.6px` vergroessern, obwohl der Abschnitt nur `619px` hoch war.
3. Das Grid hatte zunaechst eine automatische Zeilenhoehe und den normalen Spaltenabstand `gap-8`.
4. Der optionale Slot unter dem Rich Text verwendete `mt-auto`. Dadurch wurde der Text bei vorhandenen oder auch leer gerenderten Slot-Containern wieder nach oben gedrueckt.
5. Die Dev-Crosshair verwendet `100vw`, waehrend der Dokumentinhalt wegen der vertikalen Scrollbar nur `document.documentElement.clientWidth` breit ist. Bei einer Viewportbreite von `1124px` betrug die Inhaltsbreite `1109px`; die beiden Mittelpunkte lagen deshalb `7.5px` auseinander.

## Diagnose

Die entscheidende DOM-Messung auf `/ueber-mich` zeigte:

- Fullscreen-Abschnitt: `619px` hoch
- inneres Grid vor dem Fix: `804.6px` hoch
- Textblock vor der letzten Korrektur: etwa `38.5px` unter der Viewport-Mitte
- nach der Hoehenkorrektur: Textblock nur noch `8px` versetzt, verursacht durch `md:pt-4` am Slot
- nach Entfernung des Slot-Paddings: Zentrierung innerhalb des Abschnitts korrekt
- nach Headerkompensation: Textmittelpunkt `348px`, Viewport-Mittelpunkt `348px`
- nach Umstellung auf `100vw`: Bildkante `562px`, Viewport-Mitte `562px`

## Endgueltige Loesung

### `Bounded.svelte`

Wenn `fullHeight` aktiv ist, bekommt der innere Flex-Container zusaetzlich `min-h-0`. Dadurch darf er innerhalb der festen Fullscreen-Hoehe schrumpfen und wird nicht von der intrinsischen Bildhoehe vergroessert.

### `ImageTextGrid.svelte`

Im Fullscreen-Modus:

- Das Grid verwendet `md:h-full md:min-h-0 md:grid-rows-1`.
- Die Textspalte besitzt eine definierte volle Hoehe.
- `mt-auto` und `md:pt-4` des Slots werden entfernt, damit der Slot den Text nicht verschiebt.
- Die Textspalte wird auf Desktop um `headerHeight / 2` nach oben transformiert. Der Fullscreen-Bereich beginnt unterhalb des Headers, die gewuenschte Referenz ist aber die sichtbare Viewport-Mitte.
- Das Grid verwendet `width: 100vw`, damit seine Spalten mit der `100vw`-basierten Crosshair-Mitte uebereinstimmen.

### `TextMitBild/index.svelte`

Die Fullscreen-Variante verwendet `columnGap="kein"`. Der normale Spaltenabstand bleibt fuer alle anderen Varianten erhalten.

## Kuenftige Debugging-Regel

Bei Fullscreen-Layouts immer die komplette Hoehen- und Breitenkette messen:

```text
Header -> section -> Bounded inner -> Grid -> Textspalte/Bild
```

Nicht nur die Tailwind-Klassen der Textspalte pruefen. Besonders wichtig sind:

- `min-height: auto` bei Flex-Kindern
- intrinsische Bildhoehen
- automatische Grid-Tracks
- `mt-auto` und unsichtbare Slot-Container
- Unterschied zwischen `100vw` und scrollbarbereinigter Inhaltsbreite
- Referenzpunkt: Abschnittsmitte oder Viewport-Mitte
