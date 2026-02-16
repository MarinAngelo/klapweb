<script lang="ts">
  import { page } from '$app/stores';
  import { staticRoutes } from '$lib/i18n/i18n';

  export let locales: string[] = [];
  export let lang: string = '';
  export let allAlternates: any[] = [];

  // Source of Truth für das URL-Präfix
  $: dynamicDefaultLang = $page.data.mainLang || 'de-ch';

  $: links = locales.map(loc => {
    // 1. Wenn allAlternates vom Layout bereitstehen, nutzen wir diese (garantiert synchron)
    const match = allAlternates.find(a => a.lang === loc);
    if (match && match.href) {
      return { loc, href: match.href, label: loc.split('-')[0] };
    }

    // 2. Fallback-Logik (identisch mit Layout-Logik)
    const segments = $page.url.pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];
    const isFirstSegmentLang = locales.includes(firstSegment);
    const currentSlug = isFirstSegmentLang ? (segments[1] || 'home') : (firstSegment || 'home');
    
    let targetSlug = $page.params.uid || currentSlug;

    // Mapping für statische Routen
    for (const key in staticRoutes) {
      if (Object.values(staticRoutes[key]).includes(currentSlug)) {
        targetSlug = staticRoutes[key][loc];
        break;
      }
    }

    const isTargetDefault = loc === dynamicDefaultLang;
    const prefix = isTargetDefault ? '' : `/${loc}`;
    const slugPart = (targetSlug === 'home' || !targetSlug) ? '' : `/${targetSlug}`;
    
    const href = `${prefix}${slugPart}`.replace(/\/+$/, '') || '/';

    return { 
      loc, 
      href, 
      label: loc.split('-')[0] 
    };
  });
</script>

<div class="flex gap-3 items-center">
  {#if links}
    {#each links as item}
      <a
        href={item.href}
        class="text-lg font-bold uppercase transition-all {lang === item.loc ? 'underline opacity-100' : 'opacity-50 hover:opacity-100'}"
      >
        {item.label}
      </a>
      
      {#if item.loc !== links[links.length - 1].loc}
        <span class="opacity-20 text-[10px]">|</span>
      {/if}
    {/each}
  {/if}
</div>