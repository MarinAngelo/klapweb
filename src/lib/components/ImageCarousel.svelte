<script lang="ts">
    import { PrismicImage } from '@prismicio/svelte';
    import { fade } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // Props
    export let images: Array<{ image: any }> = [];
    export let autoplay = true;
    export let intervalMs = 5000;

    // Layout
    export let mode: 'background' | 'standalone' = 'background';

    // Transition
    export let transitionMs = 800;
    export let transitionEasing = cubicOut;

    // State
    let current = 0;
    let timer: ReturnType<typeof setInterval> | null = null;

    function len() {
        return images?.length ?? 0;
    }
    function has(i: number) {
        return Boolean(images?.[i]?.image);
    }

    // Funktion zum Stoppen des Autoplays, wenn manuell gewechselt wird
    function manualChange() {
        if (timer) {
            clearInterval(timer);
            // Optional: Timer auf null setzen, wenn er nicht neu starten soll
            timer = null; 
        }
    }

    function next() {
        manualChange();
        if (!len()) return;
        current = (current + 1) % len();
    }
    function prev() {
        manualChange();
        if (!len()) return;
        current = (current - 1 + len()) % len();
    }

    // 💡 NEUE FUNKTION: Handler für Tastatur-Events
    function handleKeydown(event: KeyboardEvent) {
        if (len() <= 1) return;

        switch (event.key) {
            case 'ArrowLeft':
                prev();
                event.preventDefault(); // Verhindert ggf. Scrollen oder Zurück-Aktion des Browsers
                break;
            case 'ArrowRight':
                next();
                event.preventDefault(); // Verhindert ggf. Scrollen des Browsers
                break;
        }
    }

    onMount(() => {
        if (browser) {
            // Autoplay starten
            if (autoplay && len() > 1) {
                timer = setInterval(next, intervalMs);
            }

            // 💡 Tastatur-Listener zum Dokument hinzufügen
            document.addEventListener('keydown', handleKeydown);
        }

        // Cleanup-Funktion
        return () => {
            if (timer) clearInterval(timer);
            
            // 💡 Tastatur-Listener beim Entfernen der Komponente entfernen
            if (browser) {
                document.removeEventListener('keydown', handleKeydown);
            }
        };
    });

    // Safety bei dynamischem Nachladen
    $: if (len() > 0 && current >= len()) current = len() - 1;

    // Layout-Klassen
    const outerClass =
        mode === 'background'
            ? 'absolute inset-0 h-full' // Parent muss Höhe liefern!
            : 'relative w-screen left-1/2 right-1/2 -mx-[50vw] h-screen'; // 100vh

    // Für Keyed-Block: auf URL keyen, nicht nur auf Index
    $: currentKey = images?.[current]?.image?.url ?? `idx-${current}`;
</script>

{#if len() > 0}
    <div class={outerClass}>
        <div 
            class="relative w-full h-full overflow-hidden" 
            role="region" 
            aria-label="Image carousel"
            tabindex="0" >
            {#key currentKey}
                <div
                    class="absolute inset-0 w-full h-full"
                    in:fade={{ duration: transitionMs, easing: transitionEasing }}
                    out:fade={{ duration: transitionMs, easing: transitionEasing }}
                >
                    {#if has(current)}
                        <PrismicImage
                            field={images[current].image}
                            sizes="100vw"
                            class="w-full h-full object-cover select-none"
                        />
                    {:else}
                        <div class="w-full h-full bg-black/10" />
                    {/if}
                </div>
            {/key}

            <button
                class="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white p-3 rounded-full hover:bg-black/70"
                on:click={prev}
                aria-label="Vorheriges Bild"
                type="button">‹</button
            >

            <button
                class="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white p-3 rounded-full hover:bg-black/70"
                on:click={next}
                aria-label="Nächstes Bild"
                type="button">›</button
            >

            <div
                class="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-3 py-1 rounded text-sm"
            >
                {current + 1} / {len()}
            </div>
        </div>
    </div>
{:else}
    <p class="sr-only">Keine Bilder vorhanden</p>
{/if}