<script lang="ts">
  import { PrismicImage } from '@prismicio/svelte';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { onMount, onDestroy } from 'svelte';
  import { isMobile } from '$lib/stores/isMobile';

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

  // Reduced motion
  let prefersReduced = false;
  if (typeof window !== 'undefined') {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReduced = mq.matches;
    mq.addEventListener?.('change', () => (prefersReduced = mq.matches));
  }
  $: actualDuration = prefersReduced ? 0 : transitionMs;

  // --- Swipe / Drag ---
  let dragging = false;
  let startX = 0;
  let deltaX = 0;
  const SWIPE_THRESHOLD = 40; // px für Auslösung

  function onPointerDown(e: PointerEvent) {
    if (!$isMobile) return;          // nur mobile
    dragging = true;
    startX = e.clientX;
    deltaX = 0;
    stop();                          // Autoplay pausieren
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!$isMobile || !dragging) return;
    deltaX = e.clientX - startX;
  }

  function onPointerUp(e: PointerEvent) {
    if (!$isMobile || !dragging) return;
    dragging = false;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) next(); else prev();
    }
    deltaX = 0;
    start(); // Autoplay fortsetzen
  }
</script>

{#if images.length > 0}
  <div class={`${containerClass}`}>
    <div
      class={`relative w-full ${heightClass} overflow-hidden`}
      role="region"
      aria-label="Image carousel"
      on:pointerdown={onPointerDown}
      on:pointermove={onPointerMove}
      on:pointerup={onPointerUp}
      on:mouseenter={() => !$isMobile && stop()}
      on:mouseleave={() => !$isMobile && start()}
    >
      <!-- Crossfade-Bild -->
      {#key current}
        <div
          class="absolute inset-0 w-full h-full"
          in:fade={{ duration: actualDuration, easing: transitionEasing }}
          out:fade={{ duration: actualDuration, easing: transitionEasing }}
          style="
            /* leichte visuelle Rückmeldung während Drag (nur mobile) */
            transform: translateX({$isMobile ? deltaX : 0}px);
            transition: {dragging ? 'none' : 'transform 180ms ease-out'};
          "
        >
          <PrismicImage
            field={images[current].image}
            sizes="100vw"
            class="w-full h-full object-cover select-none pointer-events-none"
          />
        </div>
      {/key}

      <!-- Controls: nur Desktop -->
      {#if !$isMobile}
        <div class="absolute inset-0 flex items-center justify-between px-4 z-10">
          <button
            on:click={prev}
            class="bg-black/40 text-white p-3 rounded-full hover:bg-black/60"
            aria-label="Vorheriges Bild"
          >‹</button>
          <button
            on:click={next}
            class="bg-black/40 text-white p-3 rounded-full hover:bg-black/60"
            aria-label="Nächstes Bild"
          >›</button>
        </div>
      {/if}

      <!-- Indicator -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm z-10">
        {current + 1} / {images.length}
      </div>
    </div>
  </div>
{:else}
  <p class="sr-only">Keine Bilder vorhanden</p>
{/if}

<!-- Keyboard nur Desktop -->
{#if !$isMobile}
  <svelte:window on:keydown={(e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
  }} />
{/if}
