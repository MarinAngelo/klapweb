<script lang="ts">
  import { page } from '$app/stores';
  import { defaultLang, staticRoutes } from '$lib/i18n/i18n';

  export let locales: string[] = [];
  export let lang: string = '';

  // 1. Reaktivität für Prismic-Daten
  $: alternateLanguages = $page.data.page?.alternate_languages || [];

  // 2. Funktion für statisches Mapping (z.B. /impressum <-> /en-us/legal-notice)
  function getStaticHref(targetLoc: string) {
    const path = $page.url.pathname;
    const segments = path.split('/').filter(Boolean);
    
    // Aktuellen Slug ohne Sprachkürzel ermitteln
    const currentSlug = (segments[0] === 'en-us' || segments[0] === 'de-ch') 
        ? segments[1] 
        : segments[0];

    // In staticRoutes aus i18n.ts suchen
    for (const key in staticRoutes) {
      const mapping = staticRoutes[key];
      if (Object.values(mapping).includes(currentSlug)) {
        const targetSlug = mapping[targetLoc];
        return targetLoc === defaultLang ? `/${targetSlug}` : `/${targetLoc}/${targetSlug}`;
      }
    }
    return null;
  }

  function getHref(targetLoc: string, currentAlts: any[]) {
    if (targetLoc === lang) return $page.url.pathname;

    // A. PRISMIC CHECK
    const alt = currentAlts.find((a: any) => a.lang === targetLoc);
    if (alt && alt.uid) {
      const slug = alt.uid === 'home' ? '' : alt.uid;
      const path = targetLoc === defaultLang ? `/${slug}` : `/${targetLoc}/${slug}`;
      return path.replace(/\/$/, '') || '/';
    }

    // B. STATISCHER CHECK (für Impressum etc.)
    const staticPath = getStaticHref(targetLoc);
    if (staticPath) return staticPath;

    // C. FALLBACK HOMEPAGE
    return targetLoc === defaultLang ? '/' : `/${targetLoc}`;
  }
</script>

<div class="flex gap-3 items-center">
  {#if locales}
    {#each locales as loc}
      <a
        href={getHref(loc, alternateLanguages)}
        class="text-xs font-bold uppercase transition-all {lang === loc ? 'underline opacity-100' : 'opacity-50 hover:opacity-100'}"
      >
        {loc.split('-')[0]}
      </a>
      
      {#if loc !== locales[locales.length - 1]}
        <span class="opacity-20 text-[10px]">|</span>
      {/if}
    {/each}
  {/if}
</div>