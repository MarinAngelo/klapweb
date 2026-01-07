<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage, PrismicLink } from '@prismicio/svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import { convertNumber } from '../../utils/convertNumber';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import ImageOverlay from '$lib/components/ImageOverlay.svelte';
	import { isMobile } from '$lib/stores/isMobile';

	export let card: Content.ImageCardsSliceDefaultPrimaryCardsItem;
	export let bodyBgColor;
	export let buttonColor;
	export let buttonBgColor;
	export let buttonHoverColor;
	export let buttonHoverBgColor;
	export let borderColor;
</script>

<li
	class="grid gap-8 border rounded-xl"
	style="
		background-color: {bodyBgColor || get(theme).pageBgColor};
		border-color: {borderColor || get(theme).pageBgColor};
	"
>
	{#if isFilled.image(card.image)}
		<div class="relative">
			{#if isFilled.link(card.buttonLink)}
				<PrismicLink field={card.buttonLink} tabindex={-1}>
					<PrismicImage field={card.image} sizes="100vw" class="w-full" />
				</PrismicLink>
			{:else}
				<PrismicImage field={card.image} sizes="100vw" class="w-full" />
			{/if}
			<ImageOverlay
				color={card.image_overlay_color || get(theme).pageBgColor}
				opacity={convertNumber(card.image_overlay_opacity || get(theme).imageOverlayOpacity)}
			/>
		</div>
	{/if}
	<div
		class="leading-relaxed"
		class:pl-6={$isMobile || !!bodyBgColor || !!borderColor}
		class:pr-6={$isMobile || !!bodyBgColor || !!borderColor}
	>
		<PrismicRichText field={card.text} />
	</div>
	{#if isFilled.link(card.buttonLink)}
		<div
			class:pl-6={$isMobile || !!bodyBgColor || !!borderColor}
			class:pr-6={$isMobile || !!bodyBgColor || !!borderColor}
		>
			<Button
				link={card.buttonLink}
				text={card.buttonText || 'Mehr erfahren'}
				color={buttonColor || get(theme).pageButtonColor}
				bgColor={buttonBgColor || get(theme).pageButtonBgColor}
				hoverColor={buttonHoverColor || get(theme).pageButtonHoverColor}
				hoverBgColor={buttonHoverBgColor || get(theme).pageButtonHoverBgColor}
			/>
		</div>
	{/if}
</li>
