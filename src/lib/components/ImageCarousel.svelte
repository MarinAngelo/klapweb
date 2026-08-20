<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	export let images: Array<{ image: any }> = [];
	export let autoplay = true;
	export let intervalMs = 5000;
	export let inactivityDelayMs = 10000;
	export let mode: 'background' | 'standalone' = 'background';
	export let transitionMs = 800;
	export let transitionEasing = cubicOut;
	export let transitionMode: string = 'Crossfade';
	export let showPagination: boolean = true;

	// State
	export let current = 0;
	let direction = 1;
	let timer: ReturnType<typeof setInterval> | null = null;
	let inactivityTimeout: ReturnType<typeof setTimeout> | null = null;

	// --- AUTOPLAY LOGIK ---
	function startAutoplay() {
		if (!autoplay || len() <= 1 || timer) return;
		timer = setInterval(autoplayNext, intervalMs);
	}

	function stopAutoplay() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		if (inactivityTimeout) {
			clearTimeout(inactivityTimeout);
			inactivityTimeout = null;
		}
	}

	// Entscheidung: Autoplay an/aus basierend auf Gerät
	function handleOrientationAutoplay() {
		if (!browser) return;

		const isTouch = window.matchMedia('(pointer: coarse)').matches;

		if (isTouch) {
			// Touch-Gerät (Mobile Portrait + Landscape) -> Autoplay AUS, Swipe aktiv
			stopAutoplay();
		} else {
			// Desktop -> Autoplay AN
			if (!timer) startAutoplay();
		}
	}

	function resetAutoplayTimeout() {
		const isTouch = window.matchMedia('(pointer: coarse)').matches;

		// Timeout nicht nutzen auf Touch-Geräten
		if (isTouch) return;

		if (inactivityTimeout) clearTimeout(inactivityTimeout);
		if (autoplay) {
			inactivityTimeout = setTimeout(() => {
				startAutoplay();
				inactivityTimeout = null;
			}, inactivityDelayMs);
		}
	}

	function len() {
		return images?.length ?? 0;
	}
	function has(i: number) {
		return Boolean(images?.[i]?.image);
	}
	function autoplayNext() {
		direction = 1;
		if (!len()) return;
		current = (current + 1) % len();
	}
	function next() {
		direction = 1;
		stopAutoplay();
		resetAutoplayTimeout();
		if (!len()) return;
		current = (current + 1) % len();
	}
	function prev() {
		direction = -1;
		stopAutoplay();
		resetAutoplayTimeout();
		if (!len()) return;
		current = (current - 1 + len()) % len();
	}

	function inTransition(node: Element, { duration }: { duration: number }) {
		const dir = direction;
		if (transitionMode === 'Slide') {
			return {
				duration,
				easing: cubicOut,
				css: (t: number) => `transform: translateX(${(1 - t) * dir * 100}%)`
			};
		}
		return { duration, css: (t: number) => `opacity: ${t}` };
	}
	function outTransition(node: Element, { duration }: { duration: number }) {
		const dir = direction;
		if (transitionMode === 'Slide') {
			return {
				duration,
				easing: cubicOut,
				css: (t: number) => `transform: translateX(${(t - 1) * dir * 100}%)`
			};
		}
		return { duration, css: (t: number) => `opacity: ${t}` };
	}
	function handleKeydown(event: KeyboardEvent) {
		if (len() <= 1) return;
		switch (event.key) {
			case 'ArrowLeft':
				prev();
				break;
			case 'ArrowRight':
				next();
				break;
		}
	}

	// --- SWIPE (Touch) ---
	let swipeStartX = 0;
	let swipeStartY = 0;
	let swiping = false;

	function onPointerDown(e: PointerEvent) {
		if (len() <= 1) return;
		swiping = true;
		swipeStartX = e.clientX;
		swipeStartY = e.clientY;
		(e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
	}

	function onPointerUp(e: PointerEvent) {
		if (!swiping) return;
		swiping = false;
		const dx = e.clientX - swipeStartX;
		const dy = e.clientY - swipeStartY;
		if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 40) {
			dx < 0 ? next() : prev();
		}
	}

	// --- LIFECYCLE ---
	onMount(() => {
		if (browser) {
			handleOrientationAutoplay();
			window.addEventListener('resize', handleOrientationAutoplay);
			window.addEventListener('orientationchange', handleOrientationAutoplay);
			document.addEventListener('keydown', handleKeydown);
		}
	});

	onDestroy(() => {
		stopAutoplay();
		if (browser) {
			window.removeEventListener('resize', handleOrientationAutoplay);
			window.removeEventListener('orientationchange', handleOrientationAutoplay);
			document.removeEventListener('keydown', handleKeydown);
		}
	});

	$: if (len() > 0 && current >= len()) current = len() - 1;

	// Wir nutzen hier 100dvh für moderne mobile Browser
	const outerClass =
		mode === 'background'
			? 'absolute inset-0 h-full'
			: 'relative w-screen left-1/2 right-1/2 -mx-[50vw] h-[100dvh]';

	$: currentKey = images?.[current]?.image?.url ?? `idx-${current}`;
</script>

{#if len() > 0}
	<div class={outerClass}>
		<div
			class="carousel-container relative w-full h-full overflow-hidden"
			role="region"
			aria-label="Image carousel"
		>
			{#key currentKey}
				<div
					class="absolute inset-0 w-full h-full"
					in:inTransition={{ duration: transitionMs }}
					out:outTransition={{ duration: transitionMs }}
				>
					{#if has(current)}
						<div
							class="absolute inset-0"
							style={transitionMode === 'Ken Burns'
								? `animation: kb${current % 4} ${intervalMs + transitionMs}ms linear forwards;`
								: ''}
						>
							<PrismicImage
								field={images[current].image}
								alt={images[current].image?.alt || ''}
								sizes="100vw"
								class="w-full h-full object-cover select-none pointer-events-none"
							/>
						</div>
					{:else}
						<div class="w-full h-full bg-black/10" />
					{/if}
				</div>
			{/key}

			<button
				class="nav-arrow absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 cursor-pointer backdrop-blur-sm"
				on:click={prev}
				aria-label="Vorheriges Bild"
				type="button"
			>
				<span class="text-xl font-bold">&#10094;</span>
			</button>

			<button
				class="nav-arrow absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 cursor-pointer backdrop-blur-sm"
				on:click={next}
				aria-label="Nächstes Bild"
				type="button"
			>
				<span class="text-xl font-bold">&#10095;</span>
			</button>

			{#if showPagination}
				<div
					class="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-3 py-1 rounded text-sm pointer-events-none backdrop-blur-md"
				>
					{current + 1} / {len()}
				</div>
			{/if}

			<div
				class="swipe-overlay absolute inset-0 z-[60]"
				style="touch-action: pan-y;"
				on:pointerdown={onPointerDown}
				on:pointerup={onPointerUp}
				on:pointercancel={() => {
					swiping = false;
				}}
			/>
		</div>
	</div>
{:else}
	<p class="sr-only">Keine Bilder vorhanden</p>
{/if}

<style>
	@keyframes kb0 {
		from {
			transform: scale(1) translate(0%, 0%);
		}
		to {
			transform: scale(1.12) translate(0%, 0%);
		}
	}
	@keyframes kb1 {
		from {
			transform: scale(1.12) translate(0%, 0%);
		}
		to {
			transform: scale(1) translate(0%, 0%);
		}
	}
	@keyframes kb2 {
		from {
			transform: scale(1.08) translate(-1.5%, -0.5%);
		}
		to {
			transform: scale(1.08) translate(1.5%, 0.5%);
		}
	}
	@keyframes kb3 {
		from {
			transform: scale(1.08) translate(1.5%, 0.5%);
		}
		to {
			transform: scale(1.08) translate(-1.5%, -0.5%);
		}
	}

	/* 1. Pfeile ausblenden auf allen Touch-Geräten */
	@media (pointer: coarse) {
		.nav-arrow {
			display: none !important;
		}
	}

	/* Swipe-Overlay nur auf Touch aktiv */
	.swipe-overlay {
		pointer-events: none;
	}
	@media (pointer: coarse) {
		.swipe-overlay {
			pointer-events: auto;
		}
	}

	/* 2. DER HÖHEN-FIX (SCROLLBARER CINEMA MODE)
       
       Änderung: position: absolute (statt fixed)
       
       Warum?
       - 'absolute' orientiert sich am Eltern-Element (Hero). 
       - Wenn du scrollst, bewegt sich der Hero nach oben -> Bild bewegt sich mit.
       - 'height: 100dvh' garantiert trotzdem volle Bildschirmhöhe.
       - 'width: 100vw' + 'left/margin' Tricks sorgen für volle Breite, 
         selbst wenn der Hero Padding hätte.
    */
	@media (pointer: coarse) and (orientation: landscape) {
		.carousel-container {
			position: absolute !important; /* WICHTIG: absolute statt fixed */
			top: 0 !important;

			/* Breakout-Trick: Garantiert volle Breite, auch im Container */
			left: 50% !important;
			right: auto !important;
			margin-left: -50vw !important;
			width: 100vw !important;

			height: 100dvh !important; /* Volle dynamische Höhe */

			z-index: 0;
			border-radius: 0 !important;
		}
	}
</style>
