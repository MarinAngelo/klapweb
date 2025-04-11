<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage, PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	export let card: Content.ImageCardsSliceDefaultPrimaryCardsItem;

	const { pageBgColor } = get(theme);
</script>

<li class="grid gap-8">
	{#if isFilled.image(card.image)}
		<div style="background-color: {pageBgColor};">
			{#if isFilled.link(card.buttonLink)}
				<PrismicLink field={card.buttonLink} tabindex={-1}>
					<PrismicImage field={card.image} sizes="100vw" class="w-full" />
				</PrismicLink>
			{:else}
				<PrismicImage field={card.image} sizes="100vw" class="w-full" />
			{/if}
		</div>
	{/if}
	<div class="leading-relaxed">
		<PrismicRichText field={card.text} />
	</div>
	{#if isFilled.link(card.buttonLink)}
		<div>
			<PrismicLink field={card.buttonLink} class="font-semibold">
				{card.buttonText || 'More Info'}
			</PrismicLink>
		</div>
	{/if}
</li>
