# Klap-Web – AI Coding Guide

## Architektur & Datenfluss

- **SvelteKit + Prismic CMS**: Headless, slice-basiert, dynamisches Theming, TypeScript, TailwindCSS.
- **Slices**: Zentrale Bausteine, in `src/lib/slices/`, deutsche Namenskonvention (z.B. `Akkordeon`, `Titelbereich`).
- **Globale Daten** (Navigation, Theme, Settings) via `src/routes/+layout.server.ts`, Seiteninhalte via `+page.server.ts`.
- **Theming**: Zentrale Verwaltung über Svelte-Store (`src/lib/stores/theme.ts`), Prismic liefert Theme-Daten, Umwandlung via `updateTheme()`.
- **Komponenten**: UI-Elemente in `src/lib/components/`, Wiederverwendung durch `<Bounded>`, `<ResponsivePrismicImage>`, `<PrismicRichText>`.

## Workflows & Entwicklung

- **Entwicklung starten**: `npm run dev` (startet Vite + Slice Machine parallel)
- **Slice Machine UI**: `npm run slicemachine` (http://localhost:9999)
- **Build/Preview**: `npm run build && npm run preview`
- **Slices anlegen**: Über Slice Machine, Implementierung in `src/lib/slices/{SliceName}/`, automatische Registrierung in `src/lib/slices/index.ts`
- **Theme-Änderungen**: Anpassung in Prismic, Transformation via `themeUpdater.ts`, Store-Update triggert reaktive Updates

## Projektkonventionen

- **Deutsche IDs/Namen** für Slices und Prismic-Felder
- **Type-Safety**: Immer Prismic-Types aus `@prismicio/client` nutzen (z.B. `Content.TextSlice`)
- **SSR-Sicherheit**: Für Stores im Server-Code immer `get(store)` verwenden
- **Reaktive Stores**: Im Template `$theme`, `$isMobile` etc. nutzen
- **Opacity/Nummern**: Prismic 0-100 → CSS 0-1 via `convertNumber()`
- **Fontgrößen**: Mapping über `getFontSize()` (deutsche Labels → px)

## Beispiele & Patterns

**Slice-Komponente:**

```svelte
<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	export let slice: Content.TextSlice;
	export let slices;
	export let context;
	export let index;
	const { pageColor } = get(theme);
</script>

<Bounded style="color: {pageColor}">...</Bounded>
```

**Rich Text:**

```svelte
<PrismicRichText field={slice.primary.text} />
```

**Responsive Image:**

```svelte
<ResponsivePrismicImage field={slice.primary.image} sizes="(max-width: 768px) 100vw, 50vw" />
```

## Wichtige Dateien & Strukturen

- **Slices:** `src/lib/slices/` (jede Slice = eigener Ordner)
- **Komponenten:** `src/lib/components/`
- **Theme-Store:** `src/lib/stores/theme.ts`
- **Utils:** `src/lib/utils/` (z.B. `convertNumber.ts`, `themeUpdater.ts`)
- **Prismic-Typen:** `src/prismicio-types.d.ts`
- **Custom Types:** `customtypes/` (Prismic Models)
- **Globale Daten:** `src/routes/+layout.server.ts`

## Prismic & Integration

- **Client-Erstellung:** Immer `createClient({ fetch, cookies })` verwenden
- **Auto-Previews:** Aktiviert via `enableAutoPreviews()`
- **Preview-Routen:** `src/routes/[[preview=preview]]/`

## Styling

- **TailwindCSS** für Utility-Styles
- **CSS Custom Properties** für Theme-Variablen
- **clsx()** für dynamische Klassen

---

**Letzte Aktualisierung:** 01.02.2026
