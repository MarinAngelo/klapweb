<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { browser } from '$app/environment';

	// Props
	export let images: Array<{ image: any }> = [];

	// Layout
	export let mode: 'background' | 'standalone' = 'background';

	// Transition
	export let transitionMs = 500;
	export let transitionEasing = cubicOut;

	// State
	let current = 0; // Aktueller Bild-Index

	// KRITISCH: Erzwingt den Key-Update im HTML
	let forceKeyUpdate = 0;

	// Steuert die Dauer der Transition (wird bei Swipe-Start auf 0 gesetzt)
	let transitionDuration = transitionMs;

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

	// Safety bei dynamischem Nachladen
	$: if (len() > 0 && current >= len()) current = len() - 1;

	// Layout-Klassen
	const outerClass =
		mode === 'background'
			? 'absolute inset-0 h-full'
			: 'relative w-screen left-1/2 right-1/2 -mx-[50vw] h-screen';

	// KRITISCH: Keying mit Zähler erzwingen
	$: currentKey = `${images?.[current]?.image?.url ?? `idx-${current}`}-${forceKeyUpdate}`;

	/* ------------------ Swipe-Logik (Direkte Zustandsänderung) ------------------ */
	let dragging = false;
	let startX = 0;
	let startY = 0;
	let deltaX = 0;
	let deltaY = 0;

	const SWIPE_THRESHOLD = 40;
	const INTENT_MIN_MOVE = 5;

	let lastT = 0;
	let velocity = 0;
	const SPEED_THRESHOLD = 0.4;

	function onPointerDown(e: PointerEvent) {

		if (!browser || len() <= 1) return;

		dragging = true;

		// Dauer auf 0 setzen, um flüssiges Mitziehen zu simulieren (falls gewünscht)
		// Oder einfach bei 500 lassen, wenn wir nur den Trigger nutzen.
		// Wir setzen es auf 0, falls die Logik zur Verschiebung später noch hinzukommt.
		transitionDuration = 0;

		startX = e.clientX;
		startY = e.clientY;
		deltaX = 0;
		deltaY = 0;

		lastT = performance.now();

		(e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;

		const now = performance.now();
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		const dt = now - lastT;
		if (dt > 0) velocity = (e.clientX - (e.clientX - dx)) / dt;

		deltaX = dx;
		deltaY = dy;

		if (Math.abs(dx) > INTENT_MIN_MOVE || Math.abs(dy) > INTENT_MIN_MOVE) {
			if (Math.abs(dx) > Math.abs(dy) * 1.5) {
				e.preventDefault?.();
			}
		}
	}

	function onPointerUp() {
		if (!dragging) return;
		dragging = false;

		// Dauer auf ursprünglichen Wert zurücksetzen
		transitionDuration = transitionMs;

		const wasHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
		const isFar = Math.abs(deltaX) > SWIPE_THRESHOLD;

		if (wasHorizontal && isFar) {

			const direction = deltaX < 0 ? 1 : -1;

			let newIndex = (current + direction + len()) % len();
			current = newIndex;

			// KRITISCH: Erzwingt den Key-Update und damit das Neurendern des Blocks
			forceKeyUpdate++;
		} else {
		}

		// Variablen zurücksetzen
		deltaX = 0;
		deltaY = 0;
		velocity = 0;
		lastT = 0;
	}
</script>

{#if len() > 0}
	<div class={outerClass}>
		<div
			class="relative w-full h-full overflow-hidden select-none"
			role="region"
			aria-label="Image carousel"
			style="touch-action: pan-y;"
		>
			{#key currentKey}
				<div
					class="absolute inset-0 w-full h-full"
					in:fade={{ duration: transitionDuration, easing: transitionEasing }}
					out:fade={{ duration: transitionDuration, easing: transitionEasing }}
				>
					{#if has(current)}
						<PrismicImage
							key={currentKey}
							field={images[current].image}
							sizes="100vw"
							class="w-full h-full object-cover select-none"
						/>
					{:else}
						<div class="w-full h-full bg-black/10" />
					{/if}
				</div>
			{/key}

			<div
				class="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-3 py-1 rounded text-sm"
			>
				{current + 1} / {len()}
			</div>

			<div
				class="absolute inset-0 z-[60]"
				on:pointerdown={onPointerDown}
				on:pointermove={onPointerMove}
				on:pointerup={onPointerUp}
				on:pointercancel={onPointerUp}
				on:pointerleave={() => dragging && onPointerUp()}
			/>
		</div>
	</div>
{:else}
	<p class="sr-only">Keine Bilder vorhanden</p>
{/if}
