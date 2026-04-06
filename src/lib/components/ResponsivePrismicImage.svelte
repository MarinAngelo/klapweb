<script lang="ts">
  import { PrismicImage } from '@prismicio/svelte';

  /**
   * Erwartet ein Prismic-ImageField mit optionalem "mobile"-Knoten,
   * so wie in deinem Beispielobjekt.
   */
  export let image: {
    url: string;
    alt?: string | null;
    copyright?: string | null;
    mobile?: {
      url: string;
      alt?: string | null;
      copyright?: string | null;
    };
    [key: string]: any; // restliche Prismic-Felder sind ok
  };

  /** Optionale Props */
  export let className = 'w-full h-auto object-cover';
  export let style: string | undefined;
  export let widths: number[] = [1280, 1920, 2560];
  export let sizes = '100vw';
  export let loading: HTMLImageElement['loading'] = 'eager';
  export let decoding: HTMLImageElement['decoding'] = 'async';
  export let figureClass = ''; // wrapper <figure>-Klassen
  export let showCaption = false; // falls du die Copyright-Zeile ausgeben willst

  // Copyright-Strategie: mobile.copyright > image.copyright
  $: rights = image?.mobile?.copyright ?? image?.copyright ?? null;

  // Hilfsfunktion: URL sicher mit zusätzl. Param erweitern (ohne Fragezeichen-Doppler)
  function withParams(url: string, extra: string) {
    if (!extra) return url;
    return url.includes('?') ? `${url}&${extra}` : `${url}?${extra}`;
  }
</script>

<figure class={figureClass}>
  <picture>
    {#if image?.mobile?.url}
      <!-- Mobile: nutze den vordefinierten zugeschnittenen Crop -->
      <source
        media="(max-width: 640px)"
        srcset={image.mobile.url}
        sizes="100vw"
      />
    {/if}

    <!-- Fallback & Desktop: generiert responsives srcset via PrismicImage -->
    <PrismicImage
      field={{
    url: image.url,
    alt: image.alt ?? null,
    copyright: image.copyright ?? null,
    id: image.id,
    dimensions: image.dimensions,
    edit: image.edit
  }}
      widths={widths}
      sizes={sizes}
      class={className}
      style={style}
      loading={loading}
      decoding={decoding}
    />
  </picture>

  {#if showCaption && rights}
    <figcaption class="mt-2 text-sm text-neutral-500">{rights}</figcaption>
  {/if}
</figure>
