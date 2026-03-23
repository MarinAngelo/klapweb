<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { theme, THEME_DEFAULTS } from '$lib/stores/theme';
	import { headerHeight } from '$lib/stores/headerHeight';
	import { convertNumber } from '$lib/utils/convertNumber';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import { addMarginIfLastIsHeading } from '$lib/utils/addMarginIfLastIsHeading';
	import { createBannerHeight } from '$lib/utils/bannerHeight';
	import { onMount, afterUpdate, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import ResponsivePrismicImage from '$lib/components/ResponsivePrismicImage.svelte';
	import ImageCarousel from '$lib/components/ImageCarousel.svelte';
	import ImageCarouselMobile from '../../components/ImageCarouselMobile.svelte';
	import { isMobile } from '$lib/stores/isMobile';
	import RichTextLabels from '$lib/components/PrismicRichText/RichTextLabels.svelte';
	import { reveal } from '$lib/actions/reveal';
	import GradientBackground from '$lib/components/GradientBackground.svelte';

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
	$: gradient = 'gradient_color_1' in slice.primary
		? {
				color1: (slice.primary as any).gradient_color_1 || null,
				color2: (slice.primary as any).gradient_color_2 || null,
				opacity1: (slice.primary as any).gradient_opacity_1 ?? 1,
				opacity2: (slice.primary as any).gradient_opacity_2 ?? 1,
				stop1: (slice.primary as any).gradient_stop_1 != null ? `${(slice.primary as any).gradient_stop_1}%` : '0%',
				stop2: (slice.primary as any).gradient_stop_2 != null ? `${(slice.primary as any).gradient_stop_2}%` : '100%',
				type: (slice.primary as any).gradient_type || 'Linear',
				angle: ((slice.primary as any).gradient_angle || '180°').replace('°', 'deg')
			}
		: null;

	const overlayOpacity = (() => {
		if (!('overlay_opacity' in slice.primary) || slice.primary.overlay_opacity === null) {
			return 0.2; // Default wenn nicht gesetzt
		}
		return convertNumber(slice.primary.overlay_opacity);
	})();

	const headerBgOpacity = convertNumber((slice.primary as any).header_bg_opacity ?? 0) || 0;
	const color = 'color' in slice.primary ? slice.primary.color : 'var(--text-color)';
	const bannerTop = slice.primary.banner_overlap ?? false;

	// bannerTop und headerBgOpacity im Theme-Store aktualisieren - beide reaktiv
	$: theme.update((t) => ({ ...t, bannerTop, headerBgOpacity }));

	onDestroy(() => {
		theme.update((t) => ({
			...t,
			headerBgOpacity: THEME_DEFAULTS.headerBgOpacity,
			bannerTop: THEME_DEFAULTS.bannerTop
		}));
	});

	// Button-Farben aus Slice (Type-safe)
	// WICHTIG: $: verwenden, damit Updates vom CMS übernommen werden
	$: buttonColor = 'button_color' in slice.primary ? (slice.primary as any).button_color : null;
	$: buttonHoverColor =
		'button_hover_color' in slice.primary ? (slice.primary as any).button_hover_color : null;
	$: buttonBgColor =
		'button_bg_color' in slice.primary ? (slice.primary as any).button_bg_color : null;
	$: buttonHoverBgColor =
		'button_hover_bg_color' in slice.primary ? (slice.primary as any).button_hover_bg_color : null;

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

	const bannerHeight = createBannerHeight(theme, headerHeight, sliceStore);

	onMount(() => addMarginIfLastIsHeading(richTextDiv));
	afterUpdate(() => addMarginIfLastIsHeading(richTextDiv));
	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	// Wir definieren das Mapping: Wenn Prismic den Typ "label" findet,
	// soll unsere RichTextLabel Komponente genutzt werden.
	const components = {
		label: RichTextLabels
	};

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

<section
	bind:this={sectionEl}
	class="relative z-0 overflow-visible"
	data-slice-type={slice.slice_type}
	style="color: {color};
		height: {$bannerHeight};
		font-family: {('font' in slice.primary &&
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
			<ImageCarouselMobile images={slice.primary.imageMerryGoRound} />
		{:else}
			<ImageCarousel
				images={slice.primary.imageMerryGoRound}
				mode="background"
				autoplay={!$isMobile}
				intervalMs={5000}
				transitionMs={8000}
			/>
		{/if}
	{/if}
	<div class="absolute inset-0 z-10 flex items-center justify-center">
		<Bounded tag="div" yPadding="none" class="w-full">
			<div class="relative w-full flex items-center justify-center">
				<!-- Overlay -->
				{#if mounted && (!$isMobile || ($isMobile && !switchOffTextOverlay))}
					<div
						class="absolute inset-0"
						style="
						background-color: {textOverlayColor};
						opacity: {textOverlayOpacity};
						pointer-events: none;
						border-radius: 3rem;
						"
						aria-hidden="true"
					></div>
				{/if}

				<!-- Inhalt mit dynamischem Padding -->
				<div
					use:reveal={fadeIn}
					class="relative z-10 text-center"
					style="padding: {textOverlayPadding};"
				>
					<!-- Responsive Anpassung des Paddings -->
					<style>
						@media (max-width: 640px) {
							.relative.z-10.text-center {
								padding: 0 !important;
							}
						}
						.leading-loose.tracking-wider-all * {
							margin-bottom: 0 !important;
						}
					</style>
					<div
						bind:this={richTextDiv}
						class="leading-loose tracking-wider-all"
						style={$isMobile && mobileFontScale !== 1.0 ? `zoom: ${mobileFontScale};` : ''}
					>
						{#if 'text' in slice.primary}
							<div style="--page-color: {color};">
								<PrismicRichText field={slice.primary.text} {components} />
							</div>
						{/if}
					</div>
					{#if 'button_link' in slice.primary && isFilled.link(slice.primary.button_link)}
						<Button
							link={slice.primary.button_link}
							text={slice.primary.button_text || 'Mehr erfahren'}
							color={buttonColor || $theme.pageButtonColor}
							bgColor={buttonBgColor || $theme.pageButtonBgColor}
							hoverColor={buttonHoverColor || $theme.pageButtonHoverColor}
							hoverBgColor={buttonHoverBgColor || $theme.pageButtonHoverBgColor}
						/>
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
