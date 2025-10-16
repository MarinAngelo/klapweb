<script lang="ts">
  import { PrismicImage } from '@prismicio/svelte';
  import { onMount, onDestroy } from 'svelte';

  export let images: any[] = [];
  export let autoplay = true;
  export let intervalMs = 5000;
  export let background = true;   // als Hintergrund
  export let fullHeight = true;   // volle Höhe (100vh)
  export let showControls = true; // Pfeile anzeigen

  let current = 0;
  let timer: any;

  function next() { if (images.length) current = (current + 1) % images.length; }
  function prev() { if (images.length) current = (current - 1 + images.length) % images.length; }

  function start() { if (autoplay && images.length > 1) timer = setInterval(next, intervalMs); }
  function stop()  { if (timer) clearInterval(timer); }

  onMount(start);
  onDestroy(stop);

  const heightClass = fullHeight ? 'h-screen' : 'h-[70vh]';
  // Hintergrund füllt Parent mit absolute inset-0, sonst Full-Width-Breakout
  const containerClass = background
    ? 'absolute inset-0 z-0'
    : 'relative w-screen left-1/2 right-1/2 -mx-[50vw]';
</script>

{#if images.length > 0}
  <div class={`${containerClass}`}>
    <div class={`relative w-full ${heightClass} overflow-hidden`} role="region" aria-label="Image Carousel" on:mouseenter={stop} on:mouseleave={start}>
      <PrismicImage
        field={images[current].image}
        sizes="100vw"
        class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />

      {#if showControls}
        <div class="absolute inset-0 flex items-center justify-between px-4 z-10" aria-hidden="false">
          <button on:click={prev} class="bg-black/40 text-white p-3 rounded-full hover:bg-black/60" aria-label="Vorheriges Bild">‹</button>
          <button on:click={next} class="bg-black/40 text-white p-3 rounded-full hover:bg-black/60" aria-label="Nächstes Bild">›</button>
        </div>
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm z-10">
          {current + 1} / {images.length}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <p class="sr-only">Keine Bilder vorhanden</p>
{/if}

<svelte:window on:keydown={(e) => {
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();
}} />
