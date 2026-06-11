<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import ResponsivePrismicImage from '$lib/components/ResponsivePrismicImage.svelte';
	import { theme } from '$lib/stores/theme';
	import type { ImageField, RichTextField } from '@prismicio/client';
	import { isFilled } from '@prismicio/client';

	export let slice: {
		primary: Record<string, unknown>;
		items: Record<string, unknown>[];
		slice_type?: string;
		variation?: string;
	};

	const p = slice.primary ?? {};

	$: bgColor = (p.bg_color as string) || $theme.pageBgColor;
	$: color = (p.color as string) || $theme.pageColor;
	$: cardBgColor = (p.card_bg_color as string) || undefined;

	$: titleText = (p.title as { text: string }[] | undefined)?.[0]?.text ?? '';
	$: items = (slice.items ?? []) as {
		quote?: RichTextField;
		author?: string;
		role?: string;
		avatar?: ImageField;
	}[];

	$: cardStyle = cardBgColor
		? `background-color: ${cardBgColor};`
		: `background-color: color-mix(in srgb, ${color} 8%, ${bgColor});`;

	$: indices = items.map((_, i) => i);

	// ── Slide-Steuerung via transform ─────────────────────────────────
	let inner: HTMLDivElement;
	let containerWidth = 0; // bind:clientWidth auf dem Wrapper
	let currentIndex = 0;

	// Auf Mobile: volle Container-Breite, kleiner Gap; ab sm: feste Breiten + gap-6
	$: isMobile = containerWidth > 0 && containerWidth < 640;
	$: cardItemWidth =
		containerWidth < 1 ? 320 : isMobile ? containerWidth : containerWidth < 768 ? 320 : 384;
	$: cardGap = isMobile ? 16 : 24;
	$: offset = -(currentIndex * (cardItemWidth + cardGap));

	function goTo(index: number) {
		currentIndex = Math.max(0, Math.min(index, items.length - 1));
	}

	function next() {
		currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
	}

	function prev() {
		currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
	}

	// ── Autoplay ──────────────────────────────────────────────────────
	let autoplayInterval: ReturnType<typeof setInterval> | null = null;
	let isPaused = false;

	function startAutoplay() {
		if (autoplayInterval) return;
		autoplayInterval = setInterval(() => {
			if (!isPaused) next();
		}, 4000);
	}

	function stopAutoplay() {
		if (autoplayInterval) {
			clearInterval(autoplayInterval);
			autoplayInterval = null;
		}
	}

	// ── Touch-Swipe ───────────────────────────────────────────────────
	let touchStartX = 0;

	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
	}

	function onTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(dx) > 40) {
			stopAutoplay();
			if (dx < 0) next();
			else prev();
		}
	}

	onMount(() => {
		startAutoplay();
	});

	onDestroy(() => stopAutoplay());
</script>

<Bounded
	tag="section"
	style="background-color: {bgColor}; color: {color}; --page-color: {color};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if titleText}
		<h2 class="mb-10">{titleText}</h2>
	{/if}

	<!-- Slide-Fenster -->
	<div
		bind:clientWidth={containerWidth}
		class="overflow-hidden md:-mx-10 md:px-10"
		role="region"
		aria-label="Testimonials"
		on:mouseenter={() => (isPaused = true)}
		on:mouseleave={() => (isPaused = false)}
		on:touchstart={onTouchStart}
		on:touchend={onTouchEnd}
	>
		<div
			bind:this={inner}
			class="flex pb-4"
			style="gap: {cardGap}px; transform: translateX({offset}px); transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);"
		>
			{#each items as item}
				<article
					class="flex-none rounded-2xl p-6 flex flex-col gap-4"
					style="width: {cardItemWidth}px; {cardStyle} border: 1px solid color-mix(in srgb, {color} 12%, transparent);"
				>
					<!-- Zitat-Text -->
					{#if item.quote && isFilled.richText(item.quote)}
						<blockquote class="flex-1 relative">
							<span
								class="absolute -top-2 -left-1 text-5xl leading-none select-none opacity-20 font-serif"
								aria-hidden="true">&ldquo;</span
							>
							<div class="pt-4 text-base leading-relaxed">
								<PrismicRichText field={item.quote} />
							</div>
						</blockquote>
					{/if}

					<!-- Autor -->
					{#if item.author || item.role}
						<footer
							class="flex items-center gap-3 pt-2 border-t"
							style="border-color: color-mix(in srgb, {color} 15%, transparent);"
						>
							{#if item.avatar && isFilled.image(item.avatar)}
								<div class="w-10 h-10 rounded-full overflow-hidden shrink-0">
									<ResponsivePrismicImage
										image={item.avatar}
										style=""
										sizes="40px"
										className="w-full h-full object-cover"
									/>
								</div>
							{/if}
							<div>
								{#if item.author}
									<p class="font-semibold text-sm leading-tight">{item.author}</p>
								{/if}
								{#if item.role}
									<p class="text-xs opacity-60 mt-0.5">{item.role}</p>
								{/if}
							</div>
						</footer>
					{/if}
				</article>
			{/each}
		</div>
	</div>

	<!-- ── Navigation: Punkte + Pfeile ───────────────────────────── -->
	{#if items.length > 1}
		<div class="flex items-center justify-between mt-6 gap-4">
			<!-- Prev -->
			<button
				on:click={() => {
					prev();
					stopAutoplay();
				}}
				aria-label="Vorheriges Zitat"
				class="w-10 h-10 rounded-full flex items-center justify-center border transition-opacity hover:opacity-100 opacity-60"
				style="border-color: color-mix(in srgb, {color} 30%, transparent); color: {color};"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
					<path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>

			<!-- Punkte-Indikator -->
			<div class="flex gap-2 flex-wrap justify-center">
				{#each indices as i}
					<button
						on:click={() => {
							goTo(i);
							stopAutoplay();
						}}
						aria-label="Zitat {i + 1}"
						class="rounded-full transition-all duration-300"
						style="
							width: {currentIndex === i ? '1.5rem' : '0.5rem'};
							height: 0.5rem;
							background-color: {color};
							opacity: {currentIndex === i ? '0.9' : '0.25'};
						"
					></button>
				{/each}
			</div>

			<!-- Next -->
			<button
				on:click={() => {
					next();
					stopAutoplay();
				}}
				aria-label="Nächstes Zitat"
				class="w-10 h-10 rounded-full flex items-center justify-center border transition-opacity hover:opacity-100 opacity-60"
				style="border-color: color-mix(in srgb, {color} 30%, transparent); color: {color};"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
					<path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
		</div>
	{/if}
</Bounded>
