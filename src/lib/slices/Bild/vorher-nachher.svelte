<script lang="ts">
	import { isFilled, type ImageField } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import { reveal } from '$lib/actions/reveal';

	export let bildLinks: ImageField;
	export let textLinks: string | null = null;
	export let bildRechts: ImageField;
	export let textRechts: string | null = null;
	export let animate: boolean = false;
	export let animationOptions: { duration: number; delay: number } = { duration: 500, delay: 0 };

	let position = 50; // 0–100 %

	function onMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		position = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
	}

	function onTouchMove(e: TouchEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		position = Math.min(
			100,
			Math.max(0, ((e.touches[0].clientX - rect.left) / rect.width) * 100)
		);
	}
</script>

<div
	role="img"
	aria-label="Vorher/Nachher Vergleich"
	class="relative select-none overflow-hidden rounded"
	use:reveal={animate ? animationOptions : { direction: 'none' }}
	on:mousemove={onMouseMove}
	on:touchmove|passive={onTouchMove}
	style="touch-action: pan-y;"
>
	<!-- Rechtes Bild (Nachher) – volle Breite als Basis -->
	{#if isFilled.image(bildRechts)}
		<PrismicImage field={bildRechts} sizes="100vw" class="block w-full" />
	{/if}

	<!-- Linkes Bild (Vorher) – per clip-path auf position% begrenzt -->
	{#if isFilled.image(bildLinks)}
		<div
			class="pointer-events-none absolute inset-0 overflow-hidden"
			style="width: {position}%;"
		>
			<PrismicImage
				field={bildLinks}
				sizes="100vw"
				class="absolute inset-0 block h-full w-full object-cover"
			/>
		</div>
	{/if}

	<!-- Trennlinie -->
	<div
		class="pointer-events-none absolute inset-y-0 z-10 flex -translate-x-1/2 flex-col items-center"
		style="left: {position}%;"
	>
		<div class="h-full w-0.5" style="background-color: var(--page-color, #fff);"></div>
		<!-- Handle -->
		<div
			class="absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full shadow-md"
			style="background-color: var(--page-color, #fff); color: var(--page-bg-color, #000); left: 50%;"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M8 5l-7 7 7 7V5zm8 0v14l7-7-7-7z" />
			</svg>
		</div>
	</div>

	<!-- Unsichtbarer Range-Input für Accessibility & Touch -->
	<input
		type="range"
		min="0"
		max="100"
		bind:value={position}
		class="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
		aria-label="Vorher/Nachher Vergleich"
		style="z-index: 20;"
	/>
</div>

{#if textLinks || textRechts}
	<div class="mt-2 flex justify-between text-sm" style="color: var(--page-color);">
		<span>{textLinks ?? ''}</span>
		<span>{textRechts ?? ''}</span>
	</div>
{/if}
