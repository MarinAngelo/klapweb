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
	import type p5Type from 'p5';

	export let slice: any;
	export let slices: any = {};
	export let context: any = {};
	export let index: number = 0;

	const isTitelbereich = slice.variation === 'mitTitelbereich';
	const p = slice.primary;

	// ---------------------------------------------------------------------------
	// Sketch — hier den p5-Code anpassen
	//
	// sketchParams wird reaktiv aktualisiert (Svelte $:).
	// Da es ein Objekt ist, liest der Sketch in draw() immer die neusten Werte —
	// ohne neu initialisiert zu werden.
	//
	// Verfügbare Parameter:
	//   sketchParams.bgColor        — Hintergrundfarbe (Hex-String oder null)
	//   sketchParams.overlayColor   — Überlagerungsfarbe (Hex oder null)
	//   sketchParams.overlayOpacity — Überlagerungstransparenz (0–1)
	//   sketchParams.bannerOverlap  — true wenn Kopfzeile überlappt wird
	//   sketchParams.bannerHeight   — '100 %' | '50 %' | '33 %'
	//   sketchParams.color          — Textfarbe (nützlich für Sketch-Elemente)
	// ---------------------------------------------------------------------------
	const sketchParams = {
		bgColor: p.hintergrundfarbe || null,
		overlayColor: p.overlay_color || null,
		overlayOpacity: p.overlay_opacity != null ? convertNumber(p.overlay_opacity) : 0,
		bannerOverlap: p.banner_overlap ?? false,
		bannerHeight: p.banner_height ?? '100 %',
		color: p.color || null
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

	function sketch(p5: p5Type, el: HTMLDivElement) {
		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
			p5.colorMode(p5.HSB, 360, 100, 100, 100);
			p5.noStroke();
		};

		p5.draw = () => {
			// Hintergrundfarbe aus CMS — mit Alpha für Nachleuchten-Effekt
			if (sketchParams.bgColor) {
				const c = p5.color(sketchParams.bgColor);
				p5.background(p5.hue(c), p5.saturation(c), p5.brightness(c), 15);
			} else {
				p5.background(0, 0, 10, 15);
			}

			const t = p5.frameCount * 0.02;
			for (let i = 0; i < 5; i++) {
				const x = p5.width / 2 + p5.cos(t + (i * p5.TWO_PI) / 5) * (p5.width * 0.3);
				const y = p5.height / 2 + p5.sin(t * 0.7 + (i * p5.TWO_PI) / 5) * (p5.height * 0.3);
				p5.fill((i * 60 + p5.frameCount) % 360, 80, 100, 60);
				p5.circle(x, y, 80 + p5.sin(t + i) * 30);
			}
		};
	}

	// ---------------------------------------------------------------------------
	// Titelbereich-Variation
	// ---------------------------------------------------------------------------
	const sliceStore = writable(slice);
	$: sliceStore.set(slice);

	const bannerHeight = createBannerHeight(theme, headerHeight, sliceStore);

	const color = p.color || 'var(--text-color)';
	const bannerTop = p.banner_overlap ?? false;

	$: if (isTitelbereich) theme.update((t) => ({ ...t, bannerTop, headerBgOpacity: convertNumber(p.header_bg_opacity ?? 0) }));

	onDestroy(() => {
		if (isTitelbereich) {
			theme.update((t) => ({
				...t,
				headerBgOpacity: THEME_DEFAULTS.headerBgOpacity,
				bannerTop: THEME_DEFAULTS.bannerTop
			}));
		}
	});

	$: overlayColor = p.overlay_color || 'transparent';
	$: overlayOpacity = p.overlay_opacity != null ? convertNumber(p.overlay_opacity) : 0.2;

	$: textOverlayColor = p.text_overlay_color || 'var(--text-color)';
	$: textOverlayOpacity = p.text_overlay_opacity != null ? convertNumber(p.text_overlay_opacity) : 0.2;
	$: switchOffTextOverlay = p.switch_off_text_overlay ?? false;

	const paddingMap: Record<string, string> = { klein: '1rem 2rem', mittel: '2rem 4rem', gross: '4rem 6rem' };
	$: textOverlayPadding = p.text_overlay_padding in paddingMap ? paddingMap[p.text_overlay_padding] : paddingMap['mittel'];

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
			font-family: {isFilled.contentRelationship(p.font) && p.font.data?.name ? p.font.data.name : 'inherit'};
		"
	>
		<!-- p5 canvas als Hintergrund — overflow-hidden hier, nicht auf section -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none">
			<P5Canvas {sketch} width="100%" height="100%" />
		</div>

		<!-- Farb-Overlay über Canvas -->
		{#if overlayOpacity > 0}
			<div
				class="absolute inset-0 pointer-events-none"
				style="background-color: {overlayColor}; opacity: {$isMobile ? textOverlayOpacity : overlayOpacity};"
			></div>
		{/if}

		<!-- Titelbereich-Inhalt -->
		<Bounded tag="div" yPadding="lg" class="relative z-10">
			<div
				class="relative flex flex-col items-center justify-center min-h-[80vh] sm:min-h-[60vh]"
				style={bannerTop
					? `margin-top: -${$headerHeight}px; padding-top: ${$isMobile ? $headerHeight : $headerHeight * 2}px;`
					: ''}
			>
				<div class="relative w-full flex items-center justify-center">
					{#if mounted && (!$isMobile || ($isMobile && !switchOffTextOverlay))}
						<div
							class="absolute inset-0"
							style="background-color: {textOverlayColor}; opacity: {textOverlayOpacity}; pointer-events: none; border-radius: 3rem;"
							aria-hidden="true"
						></div>
					{/if}
					<div use:reveal={fadeIn} class="relative z-10 text-center" style="padding: {textOverlayPadding};">
						<style>
							@media (max-width: 640px) { .relative.z-10.text-center { padding: 0 !important; } }
						</style>
						<div class="leading-loose tracking-wider-all">
							{#if p.text}
								<div style="--page-color: {color};">
									<PrismicRichText field={p.text} />
								</div>
							{/if}
						</div>
						{#if isFilled.link(p.button_link)}
							<Button
								link={p.button_link}
								text={p.button_text || 'Mehr erfahren'}
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
