<script lang="ts">
  import { PrismicImage } from '@prismicio/svelte';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { isMobile } from '$lib/stores/isMobile';
  import { get } from 'svelte/store';

  // Props
  export let images: Array<{ image: any }> = [];
  export let autoplay = true;
  export let intervalMs = 5000;

  // Layout
  export let background = true;   // als Hintergrund (absolute inset-0)
  export let fullHeight = true;   // 100vh (falls background=false)
  export let zIndexClass = 'z-0'; // z.B. 'z-0', 'z-10', 'z-20'

  // Transition
  export let transitionMs = 800;
  export let transitionEasing = cubicOut;

  // State
  let current = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let prefersReduced = false;
  $: actualDuration = prefersReduced ? 0 : transitionMs;

  // Helpers
  function go(i: number) {
    if (!images?.length) return;
    current = (i + images.length) % images.length;
  }
  function next() { go(current + 1); }
  function prev() { go(current - 1); }

  function start() {
    if (!browser) return;
    if (autoplay && images.length > 1) {
      stop();
      timer = setInterval(next, intervalMs);
    }
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  // SSR-sicher init + keyboard (nur Desktop) + reduced-motion
  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (get(isMobile)) return; // nur Desktop
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    };
    window.addEventListener('keydown', onKey);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReduced = mq.matches;
    const onRMChange = () => (prefersReduced = mq.matches);
    mq.addEventListener?.('change', onRMChange);

    start();

    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener?.('change', onRMChange);
      stop();
    };
  });

  // images geändert? current im Bounds halten
  $: if (images && images.length > 0 && current >= images.length) current = images.length - 1;

  // Klassen je nach Modus
  const heightClass = background
    ? 'h-full'                                // füllt die Höhe des Parents
    : (fullHeight ? 'h-screen' : 'h-[70vh]'); // eigenständig

  const containerClass = background
    ? `absolute inset-0 ${zIndexClass}`
    : 'relative w-screen left-1/2 right-1/2 -mx-[50vw]';

  // Swipe (nur Mobile)
  let dragging = false;
  let startX = 0;
  let deltaX = 0;
  const SWIPE_THRESHOLD = 40;

  function onPointerDown(e: PointerEvent) {
    if (!get(isMobile)) return;
    dragging = true;
    startX = e.clientX;
    deltaX = 0;
    stop();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging || !get(isMobile)) return;
    deltaX = e.clientX - startX;
  }
  function onPointerUp() {
    if (!dragging || !get(isMobile)) return;
    dragging = false;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) (deltaX < 0 ? next() : prev());
    deltaX = 0;
    start();
  }
</script>

{#if images && images.length > 0}
  <div class={containerClass}>
    <div
      class={`relative w-full ${heightClass} overflow-hidden`}
      role="region"
      aria-label="Image carousel"
      on:pointerdown={onPointerDown}
      on:pointermove={onPointerMove}
      on:pointerup={onPointerUp}
      on:mouseenter={() => { if (!get(isMobile)) stop(); }}
      on:mouseleave={() => { if (!get(isMobile)) start(); }}
    >
      {#key current}
        {#if images[current]?.image}
          <div
            class="absolute inset-0 w-full h-full"
            in:fade={{ duration: actualDuration, easing: transitionEasing }}
            out:fade={{ duration: actualDuration, easing: transitionEasing }}
            style="
              transform: translateX({get(isMobile) ? deltaX : 0}px);
              transition: {dragging ? 'none' : 'transform 180ms ease-out'};
            "
          >
            <PrismicImage
              field={images[current].image}
              sizes="100vw"
              class="w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
        {:else}
          <div class="absolute inset-0 w-full h-full bg-black/10" />
        {/if}
      {/key}

      <!-- Pfeile nur Desktop -->
      {#if !get(isMobile)}
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

      <!-- Indikator -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm z-10">
        {current + 1} / {images.length}
      </div>
    </div>
  </div>
{:else}
  <p class="sr-only">Keine Bilder vorhanden</p>
{/if}
