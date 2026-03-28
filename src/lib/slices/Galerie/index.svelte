<script lang="ts">
	import { onDestroy } from 'svelte';
	import { isFilled } from '@prismicio/client';
	import type { ImageField } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import { theme } from '$lib/stores/theme';
	import { reveal } from '$lib/actions/reveal';

	export let slice: {
		primary: Record<string, unknown>;
		items: Record<string, unknown>[];
		slice_type?: string;
		variation?: string;
	};

	const p = slice.primary ?? {};

	$: bgColor = (p.bg_color as string) || $theme.pageBgColor;
	$: color = (p.color as string) || $theme.pageColor;
	$: columns = Number(p.columns ?? 3);
	$: hasGap = (p.gap as boolean) !== false;
	$: rounded = (p.rounded as boolean) !== false;
	$: animate = (p.animate as boolean) !== false;

	$: titleText = (p.title as { text: string }[] | undefined)?.[0]?.text ?? '';

	$: items = (slice.items ?? []) as {
		image?: ImageField;
		caption?: string;
	}[];

	$: gridClass =
		columns === 4
			? 'grid-cols-2 md:grid-cols-4'
			: columns === 2
				? 'grid-cols-1 sm:grid-cols-2'
				: 'grid-cols-2 md:grid-cols-3';

	$: gapClass = hasGap ? 'gap-3 md:gap-4' : 'gap-0';
	$: roundedClass = rounded ? 'rounded-lg overflow-hidden' : '';

	const itemFadeIn = { direction: 'up' as const, distance: '20px', duration: 800, delay: 80 };
	const itemNoAnim = { direction: 'none' as const };

	// ── Lightbox ──────────────────────────────────────────────────────
	let lightboxIndex: number | null = null;

	$: lightboxItem = lightboxIndex !== null ? items[lightboxIndex] : null;
	$: lightboxImg = lightboxItem?.image as ImageField | undefined;

	function open(i: number) {
		lightboxIndex = i;
	}

	function close() {
		lightboxIndex = null;
	}

	function navNext() {
		if (lightboxIndex === null) return;
		lightboxIndex = lightboxIndex < items.length - 1 ? lightboxIndex + 1 : 0;
	}

	function navPrev() {
		if (lightboxIndex === null) return;
		lightboxIndex = lightboxIndex > 0 ? lightboxIndex - 1 : items.length - 1;
	}

	function onKeydown(e: KeyboardEvent) {
		if (lightboxIndex === null) return;
		if (e.key === 'Escape') close();
		if (e.key === 'ArrowRight') navNext();
		if (e.key === 'ArrowLeft') navPrev();
	}

	onDestroy(() => {
		// Keyboard-Listener wird in <svelte:window> gebunden
	});
</script>

<svelte:window on:keydown={onKeydown} />

<Bounded
	tag="section"
	style="background-color: {bgColor}; color: {color}; --page-color: {color};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if titleText}
		<h2 class="mb-8">{titleText}</h2>
	{/if}

	<div class="grid {gridClass} {gapClass}">
		{#each items as item, i}
			{#if item.image && isFilled.image(item.image)}
				<button
					use:reveal={animate
						? { ...itemFadeIn, delay: (itemFadeIn.delay ?? 0) + i * 60 }
						: itemNoAnim}
					class="group relative cursor-zoom-in text-left {roundedClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
					on:click={() => open(i)}
					aria-label="Bild {i + 1} vergrössern{item.caption ? ': ' + item.caption : ''}"
				>
					<!-- Bild -->
					<img
						src={item.image.url}
						alt={item.image.alt ?? item.caption ?? ''}
						loading="lazy"
						decoding="async"
						class="w-full h-full object-cover aspect-square block"
					/>

					<!-- Hover-Overlay mit Caption -->
					{#if item.caption}
						<span
							class="absolute inset-x-0 bottom-0 px-3 py-2 text-xs font-medium
							       translate-y-full group-hover:translate-y-0 transition-transform duration-300
							       {rounded ? 'rounded-b-lg' : ''}"
							style="background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); color: #fff;"
						>
							{item.caption}
						</span>
					{/if}

					<!-- Zoom-Icon -->
					<span
						class="absolute inset-0 flex items-center justify-center
						       opacity-0 group-hover:opacity-100 transition-opacity duration-200"
						aria-hidden="true"
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							stroke-width="1.5"
							class="w-8 h-8 drop-shadow-lg"
						>
							<circle cx="11" cy="11" r="7" />
							<path d="M16.5 16.5L21 21" stroke-linecap="round" />
							<path d="M11 8v6M8 11h6" stroke-linecap="round" />
						</svg>
					</span>
				</button>
			{/if}
		{/each}
	</div>
</Bounded>

<!-- ── Lightbox ─────────────────────────────────────────────────────── -->
{#if lightboxIndex !== null && lightboxImg && isFilled.image(lightboxImg)}
	<!-- Backdrop als button (schliesst bei Klick) -->
	<button
		class="fixed inset-0 z-50 w-full h-full"
		style="background: rgba(0,0,0,0.92);"
		aria-label="Lightbox schließen"
		on:click={close}
	>
	</button>

	<!-- Inhalt über dem Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
		role="dialog"
		aria-modal="true"
		aria-label="Bildvorschau"
	>
		<!-- Bild-Container: pointer-events-auto damit Klick nicht durchgeht -->
		<div
			class="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3 pointer-events-auto"
		>
			<img
				src={lightboxImg.url}
				alt={lightboxImg.alt ?? lightboxItem?.caption ?? ''}
				class="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
			/>

			<!-- Caption -->
			{#if lightboxItem?.caption}
				<p class="text-sm text-white/70">{lightboxItem.caption}</p>
			{/if}

			<!-- Zähler -->
			<p class="text-xs text-white/40">{(lightboxIndex ?? 0) + 1} / {items.length}</p>
		</div>

		<!-- Schließen-Button -->
		<button
			on:click={close}
			class="pointer-events-auto absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
			aria-label="Schließen"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6">
				<path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
			</svg>
		</button>

		<!-- Prev/Next -->
		{#if items.length > 1}
			<button
				on:click={navPrev}
				class="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
				aria-label="Vorheriges Bild"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6">
					<path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>

			<button
				on:click={navNext}
				class="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
				aria-label="Nächstes Bild"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6">
					<path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
		{/if}
	</div>
{/if}
