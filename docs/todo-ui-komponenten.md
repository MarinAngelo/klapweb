# TODO: Raw UI-Elemente → Svelte-Komponenten migrieren

## Problem

Statt `<SelectField>`, `<InputField>` o.ä. Komponenten zu verwenden, wurden an mehreren Stellen
rohe `<select>`, `<input>`, `<textarea>`-Elemente mit manuell kopierten Inline-Styles eingebaut.
→ Inkonsistentes Aussehen, schwer zu warten.

## Bereits migriert ✅

- `GlobaleEvents/index.svelte` → `<SelectField>`
- `[uid]/+page.svelte` → `<SelectField>`
- `beauftragung/zusammenfassung/+page.svelte` → `<SelectField>`

---

## Noch zu migrieren

### `src/lib/slices/PlanFilter/index.svelte`

- Raw `<select>` mit manuell gesetzten Klassen/Styles (inhaltlich korrekt, aber kein Komponenten-Einsatz)
- Migration: `<SelectField bind:value={...} options={plans.map(p => ({value: p.id, label: p.label}))} placeholder="Alle Pläne" />`

### `src/lib/slices/Aufgaben/index.svelte`

- Lokale Konstanten `inputClass` / `inputStyle` definiert (kopierter Pattern)
- Raw `<input>` und `<textarea>` mit diesen Konstanten
- Migration: Eigene `<InputField>`-ähnliche Komponente oder `<TextField>` / `<TextareaField>` erstellen

### `src/lib/slices/RessourceBuchung/index.svelte`

- Raw `<input>` / `<textarea>` mit `class="input mt-1 p-2 ..."` (manuell kopiert aus InputField)
- Migration: `<InputField>` direkt verwenden oder `<TextField>` Komponente

### `src/routes/mietvertrag/+page.svelte`

- 57 raw `<input>`, `<select>`, `<textarea>` ohne Theme-Styling
- Niedrige Priorität (interne Tool-Seite, kein Theming erwartet)
- Bei Bedarf: eigene CSS-Klassen in `<style>` Block kapseln (Svelte scoped CSS)

---

## Nächste Schritte

1. `<TextField>` Komponente analog zu `<SelectField>` erstellen (für `<input type="text/number/email/tel">`)
2. `<TextareaField>` Komponente erstellen
3. PlanFilter, Aufgaben, RessourceBuchung migrieren
