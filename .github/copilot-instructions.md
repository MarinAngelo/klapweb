# Klap-Web – AI Coding Guide (Stand: 14.02.2026)

## Architektur & Datenfluss

- **SvelteKit + Prismic CMS**: Headless, slice-basiert, dynamisches Theming, TypeScript, TailwindCSS.
- **Slices**: Zentrale Bausteine, in `src/lib/slices/`, deutsche Namenskonvention (z.B. `Akkordeon`, `Titelbereich`, `TextMitBild`, `GlobaleEvents`).
- **Komponenten**: UI-Elemente in `src/lib/components/`, inkl. legal/ und PrismicRichText/ Subfolder, Wiederverwendung durch `<Bounded>`, `<ResponsivePrismicImage>`, `<PrismicRichText>`, `<Dropdown>`, `<Navbar>`, `<Footer>`, `<LanguageSwitcher>`.
- **Globale Daten** (Navigation, Theme, Settings) via `src/routes/+layout.server.ts`, Seiteninhalte via `+page.server.ts`.
- **Theming**: Zentrale Verwaltung über Svelte-Store (`src/lib/stores/theme.ts`), Prismic liefert Theme-Daten, Umwandlung via `updateTheme()`.
- **i18n**: Übersetzungen und Sprachumschaltung über `src/lib/i18n/`, Sprachlogik in `LanguageSwitcher.svelte` und `hardcodeTexts.ts`.

## Workflows & Entwicklung

- **Entwicklung starten**: `npm run dev` (startet Vite + Slice Machine parallel)
- **Slice Machine UI**: `npm run slicemachine` (http://localhost:9999)
- **Build/Preview**: `npm run build && npm run preview`
- **Slices anlegen**: Über Slice Machine, Implementierung in `src/lib/slices/{SliceName}/`, automatische Registrierung in `src/lib/slices/index.ts`
- **Theme-Änderungen**: Anpassung in Prismic, Transformation via `themeUpdater.ts`, Store-Update triggert reaktive Updates
- **Debugging**: Nutze SvelteKit-Fehlermeldungen, Konsolen-Logs (`console.log`), und prüfe Stores/Props direkt in Komponenten. Viele Komponenten und Slices sind modular, prüfe daher auch Subfolder wie `legal/` oder `PrismicRichText/`.
- **Neue Komponenten/Utils**: Lege neue Komponenten in `src/lib/components/` an, Utilities in `src/lib/utils/`. Für neue Stores: `src/lib/stores/`.
- **i18n/Sprachumschaltung**: Übersetzungen in `src/lib/i18n/`, Sprachumschaltung via `LanguageSwitcher.svelte`.

## Projektkonventionen

- **Deutsche IDs/Namen** für Slices und Prismic-Felder (z.B. `TextMitBild`, `Kacheln`)
- **Type-Safety**: Immer Prismic-Types aus `@prismicio/client` nutzen (z.B. `Content.TextSlice`)
- **SSR-Sicherheit**: Für Stores im Server-Code immer `get(store)` verwenden
- **Reaktive Stores**: Im Template `$theme`, `$isMobile` etc. nutzen
- **Opacity/Nummern**: Prismic 0-100 → CSS 0-1 via `convertNumber()`
- **Fontgrößen**: Mapping über `getFontSize()` (deutsche Labels → px)
- **Komponentenstruktur**: Subfolder für thematische Gruppierung (z.B. `legal/`, `PrismicRichText/`)
- **Utils**: Hilfsfunktionen in `src/lib/utils/` (z.B. `color.ts`, `addMarginIfLastIsHeading.ts`)

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

**Dropdown-Komponente:**

```svelte
<DropdownButton label="Menü" />
<Dropdown>
	<Button>Aktion</Button>
</Dropdown>
```

**Sprachumschaltung:**

```svelte
<LanguageSwitcher />
```

## Wichtige Dateien & Strukturen

- **Slices:** `src/lib/slices/` (jede Slice = eigener Ordner, z.B. `Akkordeon/`, `TextMitBild/`, `GlobaleEvents/`)
- **Komponenten:** `src/lib/components/` (inkl. Subfolder `legal/`, `PrismicRichText/`)
- **Theme-Store:** `src/lib/stores/theme.ts`
- **Weitere Stores:** `src/lib/stores/` (`isMobile.ts`, `headerHeight.ts`, `isMenuOpen.ts`)
- **i18n:** `src/lib/i18n/` (`hardcodeTexts.ts`, `i18n.ts`)
- **Utils:** `src/lib/utils/` (z.B. `convertNumber.ts`, `themeUpdater.ts`, `color.ts`, `addMarginIfLastIsHeading.ts`)
- **Prismic-Typen:** `src/prismicio-types.d.ts`
- **Custom Types:** `customtypes/` (Prismic Models)
- **Globale Daten:** `src/routes/+layout.server.ts`
- **Seitenrouten:** `src/routes/[[lang=lang]]/` (mehrsprachige Seiten, z.B. `agb/`, `impressum/`)

## Prismic & Integration

- **Client-Erstellung:** Immer `createClient({ fetch, cookies })` verwenden
- **Auto-Previews:** Aktiviert via `enableAutoPreviews()`
- **Preview-Routen:** `src/routes/[[preview=preview]]/`
- **Custom Types:** in `customtypes/` pflegen, Slices in Prismic Slice Machine anlegen
- **Datenfluss:** Navigation, Theme, Settings global über Layout-Server-Load, Seiteninhalte via Page-Server-Load

## Styling

- **TailwindCSS** für Utility-Styles
- **CSS Custom Properties** für Theme-Variablen
- **clsx()** für dynamische Klassen
- **Responsive Design:** Viele Komponenten und Slices sind für mobile/desktop getrennt (z.B. `ImageCarouselMobile.svelte`)

---

**Letzte Aktualisierung:** 14.02.2026
