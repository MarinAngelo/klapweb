<script lang="ts">
	import { isFilled } from '@prismicio/client';
	import { theme, THEME_DEFAULTS } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import { headerHeight } from '$lib/stores/headerHeight';
	import { convertNumber } from '$lib/utils/convertNumber';
	import { createBannerHeight } from '$lib/utils/bannerHeight';
	import { writable } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { isMobile } from '$lib/stores/isMobile';
	import { reveal } from '$lib/actions/reveal';
	import Bounded from '$lib/components/Bounded.svelte';
	import Button from '$lib/components/Button.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import P5Canvas from '$lib/components/P5Canvas.svelte';
	import { mapAnimation } from '$lib/utils/animationMapper';
	import { getSketch } from '$lib/sketches';
	import { presetFontNames, presetFontUrls } from '$lib/utils/presetFonts';

	export let slice: any;
	export let slices: any = {};
	export let context: any = {};
	export let index: number = 0;

	const isTitelbereich = slice.variation === 'mitTitelbereich';
	const p = slice.primary;

	$: presetFont = (p.preset_font as string | null) || null;
	$: presetFontUrl = presetFont ? (presetFontUrls[presetFont] ?? null) : null;

	// sketchParams wird reaktiv aktualisiert (Svelte $:).
	// Da es ein Objekt ist, liest der Sketch in draw() immer die neusten Werte —
	// ohne neu initialisiert zu werden.
	const sketchParams = {
		bgColor: p.hintergrundfarbe || null,
		overlayColor: p.overlay_color || null,
		overlayOpacity: p.overlay_opacity != null ? convertNumber(p.overlay_opacity) : 0,
		bannerOverlap: p.banner_overlap ?? false,
		bannerHeight: p.banner_height ?? '100 %',
		color: p.color || null,
		imageUrl: p.image?.url || null
	};

	// Reaktiv aktualisieren wenn sich CMS-Daten ändern
	$: {
		sketchParams.bgColor = p.hintergrundfarbe || null;
		sketchParams.overlayColor = p.overlay_color || null;
		sketchParams.overlayOpacity = p.overlay_opacity != null ? convertNumber(p.overlay_opacity) : 0;
		sketchParams.bannerOverlap = p.banner_overlap ?? false;
		sketchParams.bannerHeight = p.banner_height ?? '100 %';
		sketchParams.color = p.color || null;
	}

	$: canvasBg = p.hintergrundfarbe || get(theme).pageBgColor;

	const sketch = getSketch(p.sketch_name, sketchParams);

	// ---------------------------------------------------------------------------
	// Titelbereich-Variation
	// ---------------------------------------------------------------------------
	const sliceStore = writable(slice);
	$: sliceStore.set(slice);

	const bannerHeight = createBannerHeight(theme, headerHeight, sliceStore);

	const color = p.color || 'var(--text-color)';
	const bannerTop = p.banner_overlap ?? false;

	$: if (isTitelbereich)
		theme.update((t) => ({
			...t,
			bannerTop,
			headerBgOpacity: convertNumber(p.header_bg_opacity ?? 0),
			hideHeaderOnLoad: p.hide_header_on_load ?? false
		}));

	onDestroy(() => {
		if (isTitelbereich) {
			theme.update((t) => ({
				...t,
				headerBgOpacity: THEME_DEFAULTS.headerBgOpacity,
				bannerTop: THEME_DEFAULTS.bannerTop,
				hideHeaderOnLoad: THEME_DEFAULTS.hideHeaderOnLoad
			}));
		}
	});

	$: overlayColor = p.overlay_color || 'transparent';
	$: overlayOpacity = p.overlay_opacity != null ? convertNumber(p.overlay_opacity) : 0.2;

	$: textOverlayColor = p.text_overlay_color || 'var(--text-color)';
	$: textOverlayOpacity =
		p.text_overlay_opacity != null ? convertNumber(p.text_overlay_opacity) : 0.2;
	$: switchOffTextOverlay = p.switch_off_text_overlay ?? false;

	const paddingMap: Record<string, string> = {
		klein: '1rem 2rem',
		mittel: '2rem 4rem',
		gross: '4rem 6rem'
	};
	$: textOverlayPadding =
		p.text_overlay_padding in paddingMap
			? paddingMap[p.text_overlay_padding]
			: paddingMap['mittel'];

	$: textOverlayPaddingMobileVal = p.text_overlay_padding_mobile as string | null | undefined;
	$: isFullScreenMobile = $isMobile && textOverlayPaddingMobileVal === 'Ganzer Bildschirm';
	$: effectiveContentPadding = $isMobile
		? textOverlayPaddingMobileVal && textOverlayPaddingMobileVal !== 'Ganzer Bildschirm'
			? (paddingMap[textOverlayPaddingMobileVal] ?? '0')
			: '0'
		: textOverlayPadding;

	const mobileTextScaleMap: Record<string, number> = {
		Klein: 0.8,
		Kleiner: 0.65,
		'Sehr klein': 0.5
	};
	$: mobileFontScale = mobileTextScaleMap[p.mobile_text_scale as string] ?? 1.0;

	$: buttonColor = p.button_color || null;
	$: buttonHoverColor = p.button_hover_color || null;
	$: buttonBgColor = p.button_bg_color || null;
	$: buttonHoverBgColor = p.button_hover_bg_color || null;

	// Standard-Variation: Animation + volle Viewportbreite
	$: anim = mapAnimation(p.animate, p.anim_direction, p.anim_delay, p.anim_duration);

	const fadeIn = { direction: 'up' as const, distance: '0px', duration: 2000, delay: 200 };

	let mounted = false;
	onMount(() => {
		const check = () => isMobile.set(window.innerWidth <= 640);
		check();
		mounted = true;
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	});
</script>

<svelte:head>
	{#if presetFontUrl}
		<link rel="stylesheet" href={presetFontUrl} />
	{/if}
</svelte:head>

{#if isTitelbereich}
	<!-- ── Titelbereich-Variation ── -->
	<!-- overflow-visible: identisch zu Titelbereich, damit margin-top-Trick für banner_overlap funktioniert -->
	<section
		class="relative z-0 overflow-visible"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		style="
			background-color: {canvasBg};
			color: {color};
			height: {$bannerHeight};
			min-height: {$bannerHeight === 'auto' ? '100vh' : 'unset'};
			font-family: {presetFont
			? `'${presetFont}'`
			: isFilled.contentRelationship(p.font) && p.font.data?.name
				? p.font.data.name
				: 'inherit'};
		"
	>
		<!-- p5 canvas als Hintergrund -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none">
			<P5Canvas {sketch} width="100%" height="100%" />
		</div>

		<!-- Farb-Overlay über Canvas -->
		{#if overlayOpacity > 0}
			<div
				class="absolute inset-0 pointer-events-none"
				style="background-color: {overlayColor}; opacity: {$isMobile
					? textOverlayOpacity
					: overlayOpacity};"
			></div>
		{/if}

		<!-- Titelbereich-Inhalt — wie im Titelbereich: absolute inset-0 statt margin-top -->
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
					<div
						use:reveal={fadeIn}
						class="relative z-10 text-center"
						style="padding: {effectiveContentPadding};"
					>
						<div
							class="leading-loose tracking-wider-all"
							style={$isMobile && mobileFontScale !== 1.0 ? `zoom: ${mobileFontScale};` : ''}
						>
							{#if p.text}
								<div style="--page-color: {color}; color: {color};">
									<PrismicRichText field={p.text} />
								</div>
							{/if}
						</div>
						{#if isFilled.link(p.button_link)}
							<div class="mt-10">
								<Button
									link={p.button_link}
									text={p.button_text || 'Mehr erfahren'}
									color={buttonColor || get(theme).pageButtonColor}
									bgColor={buttonBgColor || get(theme).pageButtonBgColor}
									hoverColor={buttonHoverColor || get(theme).pageButtonHoverColor}
									hoverBgColor={buttonHoverBgColor || get(theme).pageButtonHoverBgColor}
								/>
							</div>
						{/if}
					</div>
				</div>
			</Bounded>
		</div>
	</section>
{:else}
	<!-- ── Standard-Variation: Vollbild ── -->
	<section
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		style="background-color: {canvasBg}; width: 100vw; height: 100vh; position: relative; left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw; overflow: hidden;"
	>
		<P5Canvas {sketch} width="100%" height="100%" />
	</section>
{/if}
