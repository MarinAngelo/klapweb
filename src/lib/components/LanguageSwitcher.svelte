<script lang="ts">
  import { page } from '$app/stores';
  import { isMenuOpen } from '../stores/isMenuOpen';
  // HIER FEHLTE DER IMPORT:
  import { defaultLang } from '$lib/i18n/i18n'; 

  export let lang: string | undefined = '';
  export let locales: string[] = [];

  $: alternateLanguages = $page.data.page?.alternate_languages || [];

  function getHref(targetLang: string) {
    const alt = alternateLanguages.find((a: any) => a.lang === targetLang);
    
    // Logik für die Startseite
    if (alt && alt.uid === 'home') {
      return targetLang === defaultLang ? '/' : `/${targetLang}`;
    }

    // Logik für Unterseiten
    if (alt && alt.uid) {
      return targetLang === defaultLang ? `/${alt.uid}` : `/${targetLang}/${alt.uid}`;
    }
    
    // Fallback
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