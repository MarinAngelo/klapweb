<script lang="ts">
  import { page } from '$app/stores';
  import { defaultLang, staticRoutes } from '$lib/i18n/i18n';
  
  export let lang: string | undefined = '';
  export let locales: string[] = [];

  // Hier nutzen wir das ? um Fehler zu vermeiden, falls .page fehlt
  $: alternateLanguages = $page.data?.page?.alternate_languages || [];

  function getHref(targetLang: string) {
    const path = $page.url.pathname;
    const segments = path.split('/').filter(Boolean);

    // Slug extrahieren (z.B. "legal-notice" oder "impressum")
    const currentSlug = (segments[0] === 'en-us' || segments[0] === 'de-ch') 
        ? segments[1] 
        : segments[0];

    // 1. STATISCHES MAPPING
    for (const key in staticRoutes) {
      const mapping = staticRoutes[key];
      if (Object.values(mapping).includes(currentSlug)) {
        const targetSlug = mapping[targetLang];
        return targetLang === defaultLang ? `/${targetSlug}` : `/${targetLang}/${targetSlug}`;
      }
    }

    // 2. PRISMIC LOGIK
    // Wir prüfen hier auch nochmal mit ?, falls alternateLanguages undefined ist
    const alt = alternateLanguages?.find((a: any) => a.lang === targetLang);
    if (alt && alt.uid) {
      if (alt.uid === 'home') return targetLang === defaultLang ? '/' : `/${targetLang}`;
      return targetLang === defaultLang ? `/${alt.uid}` : `/${targetLang}/${alt.uid}`;
    }

    return targetLang === defaultLang ? '/' : `/${targetLang}`;
  }
</script>

<div class="flex gap-3 items-center">
  {#if locales && locales.length > 0}
    {#each locales as loc}
      <a
        href={getHref(loc)}
        class="text-xs font-bold uppercase tracking-wider transition-all
               {lang === loc ? 'opacity-100 underline underline-offset-4' : 'opacity-50 hover:opacity-100'}"
        on:click={() => isMenuOpen.set(false)}
      >
        {loc.split('-')[0]}
      </a>
      
      {#if loc !== locales[locales.length - 1]}
        <span class="opacity-20 text-[10px]">|</span>
      {/if}
    {/each}
  {/if}
</div>