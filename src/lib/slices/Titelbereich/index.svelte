<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { headerHeight } from '$lib/stores/headerHeight';
	import { convertNumber } from '$lib/utils';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import { addMarginIfLastIsHeading } from '$lib/utils/addMarginIfLastIsHeading';
	import { createBannerHeight } from '$lib/utils/bannerHeight';
	import { onMount, afterUpdate } from 'svelte';

	export let slice: Content.HeroSlice;

	// === PrismicRichText: margin-bottom nur wenn letztes Element h1-h6 ===
	let richTextDiv: HTMLDivElement;

	const overlayColor = slice.primary.overlay_color || 'var(--overlay-color)';
	const overlayOpacity = convertNumber(slice.primary.overlay_opacity ?? 99) || 0.99;
	const color = slice.primary.color || 'var(--text-color)';

	// Mapping von CMS-Wert zu CSS-Padding
	const paddingMap: Record<string, string> = {
		klein: '1rem 2rem',
		mittel: '2rem 4rem',
		gross: '4rem 6rem'
	};

	// Padding-Wert aus dem Slice holen und mappen
	$: textOverlayPadding = paddingMap[slice.primary.text_overlay_padding] ?? paddingMap['mittel'];

	const textOverlayColor = slice.primary.text_overlay_color || 'var(--text-color)';
	const textOverlayOpacity = convertNumber(slice.primary.text_overlay_opacity ?? 99) || 0.99;

	const bannerHeight = createBannerHeight(theme, headerHeight, slice);

	onMount(() => addMarginIfLastIsHeading(richTextDiv));
    afterUpdate(() => addMarginIfLastIsHeading(richTextDiv));

</script>

<section
	class="relative z-0 overflow-visible"
	style="background-color: {overlayColor}; color: {color}; height: {$bannerHeight};"
>
	{#if isFilled.image(slice.primary.backgroundImage)}
		<PrismicImage
			field={slice.primary.backgroundImage}
			alt=""
			class="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
			style="opacity: {overlayOpacity};"
		/>
	{/if}

	<Bounded tag="div" yPadding="lg" class="relative z-10">
		<div class="relative flex flex-col items-center justify-center min-h-[60vh]">
			<div class="relative w-full max-w-2xl flex items-center justify-center">
				<!-- Overlay -->
				<div
					class="absolute inset-0 rounded-lg"
					style="
						background-color: {textOverlayColor};
						opacity: {textOverlayOpacity};
						pointer-events: none;
					"
					aria-hidden="true"
				></div>
				<!-- Inhalt mit dynamischem Padding -->
				<div class="relative z-10 text-center" style="padding: {textOverlayPadding};">
					<div bind:this={richTextDiv}>
						<PrismicRichText field={slice.primary.text} />
					</div>
					{#if isFilled.link(slice.primary.button_link)}
						<Button
							link={slice.primary.button_link}
							text={slice.primary.button_text || 'Mehr erfahren'}
						/>
					{/if}
				</div>
			</div>
		</div>
	</Bounded>
</section>

<style>
	/* Nur für den Bereich mit .richtext */
	.richtext h1,
	.richtext h2,
	.richtext h3,
	.richtext h4,
	.richtext h5,
	.richtext h6 {
		margin-top: 4rem !important;
	}
</style>
