<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage, PrismicLink } from '@prismicio/svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import { convertNumber } from '../../utils/convertNumber';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import ImageOverlay from '$lib/components/ImageOverlay.svelte';

	export let card: Content.ImageCardsSliceDefaultPrimaryCardsItem;
	console.log('card', card.button_hover_bg_color);

</script>

<li class="grid gap-8">
	{#if isFilled.image(card.image)}
		<div class="relative">
			{#if isFilled.link(card.buttonLink)}
				<PrismicLink field={card.buttonLink} tabindex={-1}>
					<PrismicImage field={card.image} sizes="100vw" class="w-full" />
				</PrismicLink>
			{:else}
				<PrismicImage field={card.image} sizes="100vw" class="w-full" />
			{/if}
			<!-- Overlay immer außerhalb der Link-Bedingung -->
			<ImageOverlay
				color={card.image_overlay_color || get(theme).pageBgColor}
				opacity={convertNumber(card.image_overlay_opacity || get(theme).imageOverlayOpacity)}
			/>
		</div>
	{/if}
	<div class="leading-relaxed">
		<PrismicRichText field={card.text} />
	</div>
	{#if isFilled.link(card.buttonLink)}
		<div>
			<Button
				link={card.buttonLink}
				text={card.buttonText || 'Mehr erfahren'}
				color={card.button_color || get(theme).buttonColor}
				bgColor={card.button_bg_color || get(theme).buttonBgColor}
				hoverColor={card.button_hover_color || get(theme).buttonHoverColor}
				hoverBgColor={card.button_hover_bg_color || get(theme).buttonHoverBgColor}
			/>
		</div>
	{/if}
</li>
