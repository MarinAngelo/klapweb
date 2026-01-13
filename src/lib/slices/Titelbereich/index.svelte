<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { theme, THEME_DEFAULTS } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import { headerHeight } from '$lib/stores/headerHeight';
	import { convertNumber, convertNumberInverse } from '$lib/utils/convertNumber';
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

	const overlayOpacity = (() => {
		if (!('overlay_opacity' in slice.primary) || slice.primary.overlay_opacity === null) {
			return 0.2; // Default wenn nicht gesetzt
		}
		return convertNumberInverse(slice.primary.overlay_opacity);
	})();

	const headerBgOpacity = convertNumber((slice.primary as any).header_bg_opacity ?? 0) || 0;
	const color = 'color' in slice.primary ? slice.primary.color : 'var(--text-color)';
	const bannerTop = slice.primary.banner_overlap ?? false;

	// bannerTop im Theme-Store aktualisieren
	$: theme.update((t) => ({ ...t, bannerTop }));

	onMount(() => {
		theme.update((t) => ({ ...t, headerBgOpacity }));
	});

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
	// Responsive: Prüfen, ob mobile (<= 640px)
	let mounted = false;
	onMount(() => {
		const check = () => isMobile.set(window.innerWidth <= 640);
		check();
		mounted = true;
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	});

	// Wir definieren das Mapping: Wenn Prismic den Typ "label" findet,
	// soll unsere RichTextLabel Komponente genutzt werden.
	const components = {
		label: RichTextLabels
	};
</script>

<section
	class="relative z-0 overflow-visible"
	style="background-color: {isMobile ? textOverlayColor : overlayColor};
		color: {color};
		height: {$bannerHeight};
		font-family: {('font' in slice.primary &&
		isFilled.contentRelationship(slice.primary.font) &&
		slice.primary.font.data?.name) ||
		'sans-serif'};
	"
>
	{#if image && typeof image.url === 'string' && image.url}
		<ResponsivePrismicImage
			{image}
			sizes="100vw"
			widths={[1280, 1920, 2560]}
			className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
			style=""
		/>
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
				autoplay={true}
				intervalMs={5000}
				transitionMs={8000}
			/>
		{/if}
	{/if}
	<Bounded tag="div" yPadding="lg" class="relative z-10">
		<div
			class="relative flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[60vh] min-h-[80vh]"
			style={bannerTop === false ? `margin-top: -${$headerHeight}px;` : ''}
		>
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
				<div class="relative z-10 text-center" style="padding: {textOverlayPadding};">
					<!-- Responsive Anpassung des Paddings -->
					<style>
						@media (max-width: 640px) {
							.relative.z-10.text-center {
								padding: 0 !important;
							}
						}
					</style>
					<div bind:this={richTextDiv} class="leading-loose tracking-wider-all">
						{#if 'text' in slice.primary}
							<PrismicRichText field={slice.primary.text} components={components}/>
						{/if}
					</div>
					{#if 'button_link' in slice.primary && isFilled.link(slice.primary.button_link)}
						<Button
							link={slice.primary.button_link}
							text={slice.primary.button_text || 'Mehr erfahren'}
							color={buttonColor || get(theme).pageButtonColor}
							bgColor={buttonBgColor || get(theme).pageButtonBgColor}
							hoverColor={buttonHoverColor || get(theme).pageButtonHoverColor}
							hoverBgColor={buttonHoverBgColor || get(theme).pageButtonHoverBgColor}
						/>
					{/if}
				</div>
			</div>
		</div>
	</Bounded>
</section>
