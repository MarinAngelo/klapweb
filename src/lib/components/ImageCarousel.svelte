<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { isMobile } from '$lib/stores/isMobile';

	// Props
	export let images: Array<{ image: any }> = [];
	export let autoplay = true;
	export let intervalMs = 5000;

	// Layout
	// mode: "background" = füllt Parent (absolute inset-0, h-full)
	//       "standalone" = volle Viewport-Höhe (h-screen)
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

	function next() {
		if (!len()) return;
		current = (current + 1) % len();
	}
	function prev() {
		if (!len()) return;
		current = (current - 1 + len()) % len();
	}

	onMount(() => {
		if (browser && autoplay && len() > 1) {
			timer = setInterval(next, intervalMs);
		}
		return () => {
			if (timer) clearInterval(timer);
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
		<div class="relative w-full h-full overflow-hidden" role="region" aria-label="Image carousel">
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

			<!-- Pfeile: auf Desktop immer sichtbar, hoher z-index -->
			{#if !$isMobile}
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
			{/if}

			<!-- Indikator -->
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
