<script lang="ts">
  import { page } from '$app/stores';
  export let locales: string[] = [];
  export let lang: string = '';
  export let allAlternates: any[] = [];

  $: links = locales.map(loc => {
    const match = allAlternates.find(a => a.lang === loc);
    
    if (match) {
      return { loc, href: match.href, label: loc.split('-')[0] };
    }

    // FALLBACK WÄHREND DER BERECHNUNG:
    // Anstatt zur Homepage zu gehen, bauen wir den Link manuell aus der aktuellen URL
    // Das verhindert das "Springen" zur Homepage beim 2. Klick
    const currentUid = $page.params.uid;
    const isDefault = loc === 'de-ch'; // Deine mainLang
    const prefix = isDefault ? '' : `/${loc}`;
    const slug = currentUid ? `/${currentUid}` : '';
    const fallbackHref = `${prefix}${slug}`.replace(/\/$/, '') || '/';

    return { 
      loc, 
      href: fallbackHref, 
      label: loc.split('-')[0] 
    };
  });
</script>

<div class="flex gap-3 items-center">
  {#if links}
    {#each links as item}
      <a
        href={item.href}
        class="text-xs font-bold uppercase transition-all {lang === item.loc ? 'underline opacity-100' : 'opacity-50 hover:opacity-100'}"
      >
        {item.label}
      </a>
      
      {#if item.loc !== links[links.length - 1].loc}
        <span class="opacity-20 text-[10px]">|</span>
      {/if}
    {/each}
  {/if}
</div>