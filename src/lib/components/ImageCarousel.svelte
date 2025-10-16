<script lang="ts">
  import { PrismicImage } from '@prismicio/svelte';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { onMount, onDestroy } from 'svelte';

  export let images: any[] = [];
  export let autoplay = true;
  export let intervalMs = 5000;

  // Layout-Optionen
  export let background = true;   // als Hintergrund im Parent (absolute inset-0)
  export let fullHeight = true;   // volle Höhe (100vh)

  // Transition-Optionen
  export let transitionMs = 800;  // Crossfade-Dauer
  export let transitionEasing = cubicOut;

  let current = 0;
  let timer: any;

  function next()   { if (images.length) current = (current + 1) % images.length; }
  function prev()   { if (images.length) current = (current - 1 + images.length) % images.length; }
  function start()  { if (autoplay && images.length > 1) timer = setInterval(next, intervalMs); }
  function stop()   { if (timer) clearInterval(timer); }

  onMount(start);
  onDestroy(stop);

  const heightClass = fullHeight ? 'h-screen' : 'h-[70vh]';
  const containerClass = background ? 'absolute inset-0 z-0' : 'relative w-screen left-1/2 right-1/2 -mx-[50vw]';

  // Reduced motion: wenn Nutzer Animationen reduziert, setzen wir Dauer auf 0
  let prefersReduced = false;
  if (typeof window !== 'undefined') {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReduced = mq.matches;
    mq.addEventListener?.('change', () => (prefersReduced = mq.matches));
  }
  $: actualDuration = prefersReduced ? 0 : transitionMs;
</script>

{#if images.length > 0}
  <div class={`${containerClass}`}>
    <div
      class={`relative w-full ${heightClass} overflow-hidden`}
      on:mouseenter={stop}
      on:mouseleave={start}
      role="region"
      aria-label="Image carousel container"
    >
      <!--
        Keyed-Block: bei Änderung von `current` wird das alte Bild mit out:fade
        und das neue mit in:fade überblendet.
      -->
      {#key current}
        <div
          class="absolute inset-0 w-full h-full"
          in:fade={{ duration: actualDuration, easing: transitionEasing }}
          out:fade={{ duration: actualDuration, easing: transitionEasing }}
        >
          <PrismicImage
            field={images[current].image}
            sizes="100vw"
            class="w-full h-full object-cover select-none pointer-events-none"
          />
        </div>
      {/key}

      <!-- Controls -->
      <div class="absolute inset-0 flex items-center justify-between px-4 z-10" aria-hidden="false">
        <button on:click={prev} class="bg-black/40 text-white p-3 rounded-full hover:bg-black/60" aria-label="Vorheriges Bild">‹</button>
        <button on:click={next} class="bg-black/40 text-white p-3 rounded-full hover:bg-black/60" aria-label="Nächstes Bild">›</button>
      </div>

      <!-- Indicator -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm z-10">
        {current + 1} / {images.length}
      </div>
    </div>
  </div>
{:else}
  <p class="sr-only">Keine Bilder vorhanden</p>
{/if}

<svelte:window on:keydown={(e) => {
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft')  prev();
}} />
