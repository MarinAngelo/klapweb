# Bug: TextMitBild – y_padding_same funktioniert nicht auf Mobile

## Symptom

Wenn in einem TextMitBild-Slice die Option `y_padding_same` (Abstand oben / unten gleich) aktiviert ist, hat der Slice auf Mobile **keinen** unteren Abstand. Auf Desktop funktioniert es korrekt.

## Ursache (bekannt)

In `src/lib/components/Bounded.svelte` ist die `yBottom`-Map so definiert:

```ts
const yBottom: Record<string, string> = {
    none: 'pb-0',
    sm: 'md:pb-10',       // ← kein pb-* ohne md:-Prefix
    'sm-top': 'pb-0',
    base: 'md:pb-28',     // ← kein pb-* ohne md:-Prefix
    'base-top': 'pb-0',
    lg: 'md:pb-48',       // ← kein pb-* ohne md:-Prefix
    'lg-top': 'pb-0'
};
```

Die Werte haben nur `md:pb-*`-Klassen, aber kein mobiles `pb-*`. Das war ein absichtlicher Commit (`af16b1e0`, 22 Jul 2026), vermutlich um Doppel-Padding bei gesetztem `y_padding_mobile` zu verhindern.

Das bedeutet: `Bounded` gibt auf Mobile **immer** kein Bottom-Padding aus – unabhängig davon was `y_padding_same` macht.

## Was wurde versucht

1. **`yBottom`-Map in Bounded.svelte repariert** – mobile `pb-*` ergänzt → kein Effekt (unklar warum)
2. **`paddingBottomClass` mit `pbMobMap`+`pbDeskMap` in TextMitBild** – kombinierte Tailwind-Klassen wie `pb-20 md:pb-28` als String → kein Effekt
3. **`:global(.with-pb-same)` CSS mit CSS-Variablen** – auf das Bounded-Element gezielt → kein Effekt
4. **Wrapper-Div mit Svelte-scopedCSS** – `div.pb-same-wrapper` mit `padding-bottom: var(--pb)` im Svelte `<style>`-Block → nicht getestet (Änderungen wurden nicht persistent)

## Aktueller Zustand der Dateien

- `Bounded.svelte`: `yBottom` hat nur `md:pb-*` Werte (mobiles pb fehlt)
- `TextMitBild/index.svelte`: `computedPaddingBottomClass` greift nur wenn `y_padding_mobile` gesetzt ist; bei nur `y_padding_same` ohne `y_padding_mobile` → `undefined` → Bounded fällt auf `yBottom` zurück → kein Mobile-Padding

## Empfehlung für nächste Untersuchung

1. In DevTools prüfen: welche CSS-Klassen hat das `<section>`-Element des betroffenen Slice auf Mobile?
2. Prüfen: Gibt es ein übergeordnetes Element (z.B. `Bounded`) das `padding-bottom: 0` explizit setzt und damit alle Kind-Klassen überschreibt?
3. Einfachster Fix wäre: Wrapper-Div **vor** Bounded im Template, mit `style="padding-bottom: {wert}"` als Inline-Style (kein Tailwind, kein Svelte-CSS, kein `:global`) – aber das wurde noch nicht getestet.
4. Alternativ: `Bounded.svelte` erhält einen neuen Prop `paddingBottomRaw: string` der direkt als `style`-Wert übergeben wird, ohne Tailwind.
