<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import { headerHeight } from '$lib/stores/headerHeight';
	import { convertNumber, convertNumberInverse } from '$lib/utils/convertNumber';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import { addMarginIfLastIsHeading } from '$lib/utils/addMarginIfLastIsHeading';
	import { createBannerHeight } from '$lib/utils/bannerHeight';
	import { onMount, afterUpdate } from 'svelte';
	import { writable } from 'svelte/store';
	import ResponsivePrismicImage from '$lib/components/ResponsivePrismicImage.svelte';

	export let slice: Content.HeroSlice;
	console.log('slice in Titelbereich:', slice.primary.backgroundImage);
	export let image = slice.primary.backgroundImage;
	const sliceStore = writable(slice);

	// Wenn sich slice ändert, aktualisiere den Store
	$: sliceStore.set(slice);

	// === PrismicRichText: margin-bottom nur wenn letztes Element h1-h6 ===
	let richTextDiv: HTMLDivElement;

	const overlayColor = slice.primary.overlay_color || 'var(--overlay-color)';
	const overlayOpacity = convertNumberInverse(slice.primary.overlay_opacity ?? 100) || 100;
	console.log('overlayOpacity fomr cms:', slice.primary.overlay_opacity);
	console.log('overlayOpacity:', overlayOpacity);
	const color = slice.primary.color || 'var(--text-color)';
	const bannerTop = slice.primary.banner_overlap ?? false;

	// bannerTop im Theme-Store aktualisieren
	$: theme.update((t) => ({ ...t, bannerTop }));

	// Fallbacks aus dem globalen Theme holen
	const { pageLinkColor, pageLinkHoverColorText, pageLinkHoverColorBg } = get(theme);

	// Button-Farben aus Slice, mit Fallbacks
	const buttonBgColor = slice.primary.button_bg_color || 'transparent';
	const buttonBgColorHover = slice.primary.button_bg_color_hover || pageLinkHoverColorBg;
	const buttonTextColor = slice.primary.button_text_color || pageLinkColor;
	const buttonTextColorHover = slice.primary.button_text_color_hover || pageLinkHoverColorText;

	// Mapping von CMS-Wert zu CSS-Padding
	const paddingMap: Record<string, string> = {
		klein: '1rem 2rem',
		mittel: '2rem 4rem',
		gross: '4rem 6rem'
	};

	// Padding-Wert aus dem Slice holen und mappen
	$: textOverlayPadding =
		paddingMap[slice.primary.text_overlay_padding ?? 'mittel'] ?? paddingMap['mittel'];

	const textOverlayColor = slice.primary.text_overlay_color || 'var(--text-color)';
	const textOverlayOpacity = convertNumber(slice.primary.text_overlay_opacity ?? 1) || 1;
	console.log('textOverlayOpacity fomr cms:', slice.primary.text_overlay_opacity);
	console.log('textOverlayOpacity:', textOverlayOpacity);

	const bannerHeight = createBannerHeight(theme, headerHeight, sliceStore);

	onMount(() => addMarginIfLastIsHeading(richTextDiv));
	afterUpdate(() => addMarginIfLastIsHeading(richTextDiv));
	// Responsive: Prüfen, ob mobile (<= 640px)
	let isMobile = false;
	onMount(() => {
		const check = () => (isMobile = window.innerWidth <= 640);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	});
</script>

<section
	class="relative z-0 overflow-visible"
	style="background-color: {isMobile
		? textOverlayColor
		: overlayColor}; color: {color}; height: {$bannerHeight};"
>
	{#if image && typeof image.url === 'string' && image.url}
		<ResponsivePrismicImage
			{image}
			sizes="100vw"
			widths={[1280, 1920, 2560]}
			className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
			style="opacity: {isMobile ? textOverlayOpacity : overlayOpacity};"
		/>
	{/if}
	<Bounded tag="div" yPadding="lg" class="relative z-10">
		<div
			class="relative flex flex-col items-center justify-center min-h-[60vh]"
			style={bannerTop === false ? `margin-top: -${$headerHeight}px;` : ''}
		>
			<div class="relative w-full max-w-2xl flex items-center justify-center">
				<!-- Overlay -->
				{#if !isMobile}
					<div
						class="absolute inset-0 rounded-lg"
						style="
						background-color: {textOverlayColor};
						opacity: {textOverlayOpacity};
						pointer-events: none;
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
					<div bind:this={richTextDiv}>
						<PrismicRichText field={slice.primary.text} />
					</div>
					{#if isFilled.link(slice.primary.button_link)}
						<Button
							link={slice.primary.button_link}
							text={slice.primary.button_text || 'Mehr erfahren'}
							color={buttonTextColor}
							bgColor={buttonBgColor}
							hoverBgColor={buttonBgColorHover}
							hoverTextColor={buttonTextColorHover}
						/>
					{/if}
				</div>
			</div>
		</div>
	</Bounded>
</section>
