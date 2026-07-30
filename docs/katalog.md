# Slice-Katalog

Der Slice-Katalog (`/katalog`) ist ein internes Tool das alle Slices visuell darstellt – ohne CMS-Inhalte. Inhalte werden durch `src/lib/utils/mockSliceData.ts` generiert.

## Mock-Daten anpassen

### Slice-spezifische Texte (StructuredText)

Für `StructuredText`-Felder wird standardmässig Lorem ipsum verwendet. Um für einen bestimmten Slice realistische Inhalte zu zeigen, füge einen Sonderfall in `mockSliceData.ts` ein – direkt am Anfang des `StructuredText`-case-Blocks:

```ts
case 'StructuredText': {
    // Slice-spezifische Mock-Texte
    if (sliceName === 'MeinSlice' && key === 'text') {
        return [
            { type: 'heading3', text: 'Beispiel-Titel', spans: [] },
            { type: 'paragraph', text: 'Beispieltext Zeile 1', spans: [] },
            { type: 'paragraph', text: 'Beispieltext Zeile 2', spans: [] }
        ];
    }
    // ... Rest des Blocks
}
```

`sliceName` = Verzeichnisname des Slices (z.B. `AdresseUndMap`), `key` = Feldname im model.json.

### Text-Felder (Text)

Für `Text`-Felder gilt dasselbe Prinzip, am Anfang des `Text`-case-Blocks:

```ts
case 'Text': {
    if (sliceName === 'MeinSlice' && key === 'map_url') return 'https://...';
    // ...
}
```

### Mock-Bilder

Bilder werden via `https://picsum.photos/seed/{key}{index}/800/600` generiert. Um ein spezifisches Bild zu setzen, kann ein Eintrag in `gating.json` unter `slices.{SliceName}.catalog.variations.{variationId}.mockImages` gemacht werden:

```json
"slices": {
    "MeinSlice": {
        "catalog": {
            "variations": {
                "default": {
                    "mockImages": {
                        "image": "https://beispiel.ch/mein-bild.jpg"
                    }
                }
            }
        }
    }
}
```

## Mobile-Preview

Der Telefon-Button im Katalog simuliert Mobile durch `max-width: 390px` und CSS-Overrides via `.preview-mobile`:

- `md:grid-cols-*` → 1 Spalte
- `md:flex-row` → `flex-direction: column`

Dies ist eine **Annäherung** – echte responsive Breakpoints reagieren auf Viewport-Breite, nicht auf Container-Breite. Für exakte Mobile-Tests den Browser-DevTools-Responsive-Modus verwenden.

## Navigation

`/katalog` leitet automatisch auf das erste Element weiter (alphabetisch nach Slice-Name). Die Reihenfolge entspricht der alphabetischen Sortierung in `+layout.server.ts`.

## Slices aus dem Katalog ausschliessen

In `+layout.server.ts` gibt es eine `SKIP`-Liste:

```ts
const SKIP = new Set(['form/kauf', 'image_cards/plaene']);
```

Format: `{model.id}/{variation.id}`. Einträge hier werden im Katalog nicht angezeigt.
