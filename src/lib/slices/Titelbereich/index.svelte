<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { theme, THEME_DEFAULTS } from '$lib/stores/theme';
	import BannerThemeSync from '$lib/components/BannerThemeSync.svelte';
	import { headerHeight } from '$lib/stores/headerHeight';
	import { convertNumber } from '$lib/utils/convertNumber';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import { addMarginIfLastIsHeading } from '$lib/utils/addMarginIfLastIsHeading';
	import { createBannerHeight } from '$lib/utils/bannerHeight';
	import { onMount, afterUpdate, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import ResponsivePrismicImage from '$lib/components/ResponsivePrismicImage.svelte';
	import ImageCarousel from '$lib/components/ImageCarousel.svelte';
	import ImageCarouselMobile from '../../components/ImageCarouselMobile.svelte';
	import { isMobile } from '$lib/stores/isMobile';
	import { reveal } from '$lib/actions/reveal';
	import GradientBackground from '$lib/components/GradientBackground.svelte';
	import { presetFontNames, presetFontUrls } from '$lib/utils/presetFonts';

	// Reines Fade-in ohne Bewegung (distance: '0px')
	const fadeIn = { direction: 'up' as const, distance: '0px', duration: 2000, delay: 200 };

	export let slice: Content.HeroSlice;
	// Reaktives Bild: Aktualisiert sich wenn sich slice ändert
	$: image = 'backgroundImage' in slice.primary ? slice.primary.backgroundImage : null;
	const sliceStore = writable(slice);

	// Wenn sich slice ändert, aktualisiere den Store
	$: sliceStore.set(slice);

	// === PrismicRichText: margin-bottom nur wenn letztes Element h1-h6 ===
	let richTextDiv: HTMLDivElement;

	const switchOffTextOverlay = (slice.primary as any).switch_off_text_overlay ?? false;
	const overlayColor = slice.primary.overlay_color || 'var(--overlay-color)';
	$: bgColor = 'bg_color' in slice.primary ? (slice.primary as any).bg_color || null : null;
	$: gradientFallback = bgColor ?? ($isMobile ? textOverlayColor : overlayColor);
	$: gradient =
		'gradient_color_1' in slice.primary
			? {
					color1: (slice.primary as any).gradient_color_1 || null,
					color2: (slice.primary as any).gradient_color_2 || null,
					opacity1: (slice.primary as any).gradient_opacity_1 ?? 1,
					opacity2: (slice.primary as any).gradient_opacity_2 ?? 1,
					stop1:
						(slice.primary as any).gradient_stop_1 != null
							? `${(slice.primary as any).gradient_stop_1}%`
							: '0%',
					stop2:
						(slice.primary as any).gradient_stop_2 != null
							? `${(slice.primary as any).gradient_stop_2}%`
							: '100%',
					type: (slice.primary as any).gradient_type || 'Linear',
					angle: ((slice.primary as any).gradient_angle || '180°').replace('°', 'deg')
				}
			: null;

	$: presetFont =
		'preset_font' in slice.primary ? (slice.primary as any).preset_font || null : null;
	$: presetFontUrl = presetFont ? (presetFontUrls[presetFont] ?? null) : null;

	const overlayOpacity = (() => {
		if (!('overlay_opacity' in slice.primary) || slice.primary.overlay_opacity === null) {
			return 0.2; // Default wenn nicht gesetzt
		}
		return convertNumber(slice.primary.overlay_opacity);
	})();

	const hideHeaderOnLoad = (slice.primary as any).hide_header_on_load ?? false;
	const color = 'color' in slice.primary ? slice.primary.color : 'var(--text-color)';

	// hideHeaderOnLoad im Theme-Store aktualisieren (bannerTop/headerBgOpacity via BannerThemeSync)
	$: theme.update((t) => ({ ...t, hideHeaderOnLoad }));

	$: btsBannerOverlap = (slice.primary as any).banner_overlap ?? false;
	$: btsHeaderBgOpacity = (slice.primary as any).header_bg_opacity ?? null;

	onDestroy(() => {
		theme.update((t) => ({
			...t,
			hideHeaderOnLoad: THEME_DEFAULTS.hideHeaderOnLoad
		}));
	});

	// Button-Farben aus Slice (Type-safe)
	// WICHTIG: $: verwenden, damit Updates vom CMS übernommen werden
	$: btnStyleName =
		'button_style' in slice.primary
			? (slice.primary as any).button_style?.uid || undefined
			: undefined;
	$: buttonColor = 'button_color' in slice.primary ? (slice.primary as any).button_color : null;
	$: buttonHoverColor =
		'button_hover_color' in slice.primary ? (slice.primary as any).button_hover_color : null;
	$: buttonBgColor =
		'button_bg_color' in slice.primary ? (slice.primary as any).button_bg_color : null;
	$: buttonHoverBgColor =
		'button_hover_bg_color' in slice.primary ? (slice.primary as any).button_hover_bg_color : null;
	$: buttonSize = (() => {
		const v = 'button_size' in slice.primary ? (slice.primary as any).button_size : null;
		return v === 'Klein' ? 'sm' : v === 'Gross' ? 'lg' : 'md';
	})() as 'sm' | 'md' | 'lg';

	// Mapping von CMS-Wert zu CSS-Padding
	const paddingMap: Record<string, string> = {
		klein: '1rem 2rem',
		mittel: '2rem 4rem',
		gross: '4rem 6rem'
	};

	// Mobile Text-Skalierung
	const mobileTextScaleMap: Record<string, number> = {
		Klein: 0.8,
		Kleiner: 0.65,
		'Sehr klein': 0.5
	};
	$: mobileFontScale =
		mobileTextScaleMap[(slice.primary as any).mobile_text_scale as string] ?? 1.0;

	// Padding-Wert aus dem Slice holen und mappen
	$: textOverlayPadding =
		'text_overlay_padding' in slice.primary &&
		(slice.primary.text_overlay_padding ?? '') in paddingMap
			? paddingMap[slice.primary.text_overlay_padding ?? '']
			: paddingMap['mittel'];

	$: textOverlayPaddingMobileVal = (slice.primary as any).text_overlay_padding_mobile as
		| string
		| null
		| undefined;
	$: isFullScreenMobile = $isMobile && textOverlayPaddingMobileVal === 'Ganzer Bildschirm';
	$: effectiveContentPadding = $isMobile
		? textOverlayPaddingMobileVal && textOverlayPaddingMobileVal !== 'Ganzer Bildschirm'
			? (paddingMap[textOverlayPaddingMobileVal] ?? '0')
			: '0'
		: textOverlayPadding;

	const textOverlayColor =
		'text_overlay_color' in slice.primary
			? slice.primary.text_overlay_color || 'var(--text-color)'
			: 'var(--text-color)';
	const textOverlayOpacity = (() => {
		if (!('text_overlay_opacity' in slice.primary) || slice.primary.text_overlay_opacity === null) {
			return 0.2; // Default wenn nicht gesetzt
		}
		const result = convertNumber(slice.primary.text_overlay_opacity);
		return result;
	})();

	// Karusell: aktueller Slide-Index (gebunden an beide Carousel-Komponenten)
	let carouselCurrent = 0;

	// Übernimmt Block-Typ und Label-Spans aus primary, ersetzt Text + Inline-Spans aus item.
	function mergeTexts(primary: any[], item: any[]): any[] {
		if (!primary?.length) return item;
		return primary.map((pb, i) => {
			const ib = item?.[i];
			if (!ib?.text) return pb;
			const newLen = (ib.text as string).length;
			const labelSpans = (pb.spans ?? [])
				.filter((s: any) => s.type === 'label')
				.map((s: any) => ({ ...s, end: newLen }));
			const contentSpans = (ib.spans ?? []).filter((s: any) => s.type !== 'label');
			return { ...pb, text: ib.text, spans: [...labelSpans, ...contentSpans] };
		});
	}

	$: carouselItems =
		slice.variation === 'mitBildKarusell'
			? (((slice.primary as any).imageMerryGoRound as Array<{ image: any; text: any }> | null) ??
				[])
			: [];
	$: activeItem = carouselItems[carouselCurrent] ?? null;
	$: primaryText = 'text' in slice.primary ? (slice.primary.text as any[]) : [];
	$: carouselTransitionMs = (slice.primary as any).transition_duration_ms || 8000;
	$: carouselDisplayMs = (slice.primary as any).display_duration_ms || 2000;
	$: carouselIntervalMs = carouselTransitionMs + carouselDisplayMs;
	$: carouselTransitionMode = (slice.primary as any).transition_mode || 'Crossfade';
	$: carouselShowPagination = (slice.primary as any).show_pagination !== false;
	$: activeText =
		activeItem?.text && isFilled.richText(activeItem.text)
			? mergeTexts(primaryText, activeItem.text as any[])
			: primaryText;

	const bannerHeight = createBannerHeight(theme, headerHeight, sliceStore);

	onMount(() => addMarginIfLastIsHeading(richTextDiv));
	afterUpdate(() => addMarginIfLastIsHeading(richTextDiv));
	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	// Parallax – direktes DOM-Update, kein Svelte-Re-Render
	let sectionEl: HTMLElement;
	let parallaxInner: HTMLElement | undefined;
	const PARALLAX_FACTOR = 0.3;
	let rafId: number;

	function handleScroll() {
		if (!sectionEl || !parallaxInner) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const inner = parallaxInner;
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(() => {
			const rect = sectionEl.getBoundingClientRect();
			const pY = Math.max(0, -rect.top * PARALLAX_FACTOR);
			inner.style.transform = `translate3d(0, ${pY}px, 0)`;
		});
	}

	onMount(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		return () => {
			window.removeEventListener('scroll', handleScroll);
			cancelAnimationFrame(rafId);
		};
	});
</script>

<BannerThemeSync bannerOverlap={btsBannerOverlap} headerBgOpacityRaw={btsHeaderBgOpacity} />
<svelte:head>
	{#if presetFontUrl}
		<link rel="stylesheet" href={presetFontUrl} />
	{/if}
</svelte:head>

<section
	bind:this={sectionEl}
	class="relative z-0 overflow-visible"
	data-slice-type={slice.slice_type}
	style="color: {color};
		height: {$bannerHeight};
		{$bannerHeight === 'auto' ? 'min-height: 100vh;' : ''}
		font-family: {presetFont
		? `'${presetFont}'`
		: ('font' in slice.primary &&
				isFilled.contentRelationship(slice.primary.font) &&
				slice.primary.font.data?.name) ||
			'inherit'};
	"
>
	<GradientBackground
		color1={gradient?.color1 ?? null}
		color2={gradient?.color2 ?? null}
		opacity1={gradient?.opacity1 ?? 1}
		opacity2={gradient?.opacity2 ?? 1}
		stop1={gradient?.stop1 ?? '0%'}
		stop2={gradient?.stop2 ?? '100%'}
		type={gradient?.type ?? 'Linear'}
		angle={gradient?.angle ?? '180deg'}
		fallback={gradientFallback}
	/>
	{#if image && typeof image.url === 'string' && image.url}
		<div class="absolute inset-0 overflow-hidden pointer-events-none">
			<div bind:this={parallaxInner} class="absolute inset-x-0" style="height: 120%; top: -10%;">
				<ResponsivePrismicImage
					{image}
					sizes="100vw"
					widths={[1280, 1920, 2560]}
					className="absolute inset-0 h-full w-full object-cover select-none"
					style=""
				/>
			</div>
		</div>
		<!-- Color overlay over the image -->
		<div
			class="absolute inset-0 h-full w-full pointer-events-none select-none"
			style="background-color: {overlayColor}; opacity: {$isMobile
				? textOverlayOpacity
				: overlayOpacity};"
		></div>
	{/if}
	{#if slice.variation === 'mitBildKarusell'}
		{#if $isMobile}
			<ImageCarouselMobile
				images={slice.primary.imageMerryGoRound}
				bind:current={carouselCurrent}
				transitionMs={carouselTransitionMs}
				transitionMode={carouselTransitionMode}
				showPagination={carouselShowPagination}
			/>
		{:else}
			<ImageCarousel
				images={slice.primary.imageMerryGoRound}
				bind:current={carouselCurrent}
				mode="background"
				autoplay={!$isMobile}
				intervalMs={carouselIntervalMs}
				transitionMs={carouselTransitionMs}
				transitionMode={carouselTransitionMode}
				showPagination={carouselShowPagination}
			/>
		{/if}
	{/if}
	<div class="absolute inset-0 z-10 flex items-center justify-center">
		<!-- Ganzer Bildschirm Mobile: Overlay füllt den gesamten Bereich -->
		{#if mounted && isFullScreenMobile && !switchOffTextOverlay}
			<div
				class="absolute inset-0"
				style="background-color: {textOverlayColor}; opacity: {textOverlayOpacity}; pointer-events: none;"
				aria-hidden="true"
			></div>
		{/if}
		<Bounded tag="div" yPadding="none" class="w-full">
			<div class="relative w-full flex items-center justify-center">
				<!-- Box-Overlay (nicht Ganzer Bildschirm) -->
				{#if mounted && !isFullScreenMobile && (!$isMobile || !switchOffTextOverlay)}
					<div
						class="absolute inset-0"
						style="background-color: {textOverlayColor}; opacity: {textOverlayOpacity}; pointer-events: none; border-radius: 3rem;"
						aria-hidden="true"
					></div>
				{/if}

				<!-- Inhalt mit dynamischem Padding -->
				<div
					use:reveal={fadeIn}
					class="relative z-10 text-center"
					style="padding: {effectiveContentPadding};"
				>
					<style>
						.leading-loose.tracking-wider-all * {
							margin-bottom: 0 !important;
						}
					</style>
					<div
						bind:this={richTextDiv}
						class="leading-loose tracking-wider-all"
						style={$isMobile && mobileFontScale !== 1.0 ? `zoom: ${mobileFontScale};` : ''}
					>
						{#if activeText.length}
							{#key carouselCurrent}
								<div style="--page-color: {color}; color: {color};" in:fade={{ duration: 600 }}>
									<PrismicRichText field={activeText} />
								</div>
							{/key}
						{/if}
					</div>
					{#if 'button_link' in slice.primary && isFilled.link(slice.primary.button_link)}
						<div class="mt-8">
							<Button
								link={slice.primary.button_link}
								text={slice.primary.button_text || 'Mehr erfahren'}
								styleName={btnStyleName}
								color={buttonColor || undefined}
								bgColor={buttonBgColor || undefined}
								hoverColor={buttonHoverColor || undefined}
								hoverBgColor={buttonHoverBgColor || undefined}
								size={buttonSize}
							/>
						</div>
					{/if}
				</div>
			</div>
		</Bounded>
	</div>
</section>

<style>
	@media (pointer: coarse) and (orientation: landscape) {
		section {
			scroll-snap-align: start;
		}
	}
</style>
