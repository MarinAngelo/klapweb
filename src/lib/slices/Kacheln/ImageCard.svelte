<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage, PrismicLink } from '@prismicio/svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import { convertNumber } from '../../utils/convertNumber';
	import { theme } from '$lib/stores/theme';
	import ImageOverlay from '$lib/components/ImageOverlay.svelte';
	import { reveal, type RevealOptions } from '$lib/actions/reveal';

	export let card: Content.ImageCardsSliceDefaultPrimaryCardsItem;
	export let roundCorners = true;
	export let bodyBgColor;
	export let bodyColor;
	export let buttonColor;
	export let buttonBgColor;
	export let buttonHoverColor;
	export let buttonHoverBgColor;
	export let borderColor;
	export let revealOptions: RevealOptions = { direction: 'none' };

	// CMS-Felder können null objects sein - prüfe auf echten Wert
	const hasBorderColor = !!(borderColor && borderColor !== null && borderColor !== '');
	const actualBorderColor = hasBorderColor ? borderColor : null;
</script>

<li
	use:reveal={revealOptions}
	class="flex flex-col gap-8 {hasBorderColor ? 'border-2' : 'shadow-lg'} {roundCorners ? 'rounded-2xl' : ''}"
	style="
		background-color: {bodyBgColor || $theme.pageBgColor};
		--custom-card-color: {bodyColor || $theme.pageColor};
		{hasBorderColor ? `border-color: ${actualBorderColor};` : ''}
	"
>
	{#if isFilled.image(card.image)}
		<div class="relative">
			{#if isFilled.link(card.buttonLink)}
				<PrismicLink field={card.buttonLink} tabindex={-1}>
					<PrismicImage
						field={card.image}
						sizes="100vw"
						class="w-full {roundCorners ? 'rounded-t-2xl' : ''}"
					/>
				</PrismicLink>
			{:else}
				<PrismicImage
					field={card.image}
					sizes="100vw"
					class="w-full {roundCorners ? 'rounded-t-2xl' : ''}"
				/>
			{/if}
			<ImageOverlay
				color={card.image_overlay_color || $theme.pageBgColor}
				opacity={convertNumber(card.image_overlay_opacity || $theme.imageOverlayOpacity)}
				{roundCorners}
			/>
		</div>
	{/if}
	<div class="leading-relaxed custom-card-color pl-6 pr-6 pb-6 grow">
		<PrismicRichText field={card.text} />
	</div>
	{#if isFilled.link(card.buttonLink)}
		<div class="pl-6 pr-6">
			<Button
				link={card.buttonLink}
				text={card.buttonText || 'Mehr erfahren'}
				color={buttonColor || $theme.pageButtonColor}
				bgColor={buttonBgColor || $theme.pageButtonBgColor}
				hoverColor={buttonHoverColor || $theme.pageButtonHoverColor}
				hoverBgColor={buttonHoverBgColor || $theme.pageButtonHoverBgColor}
			/>
		</div>
	{/if}
</li>

<style>
	.custom-card-color :global(*) {
		color: var(--custom-card-color) !important;
	}
</style>
