<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicText } from '@prismicio/svelte';

	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import Bounded from '$lib/components/Bounded.svelte';
	import ImageCard from './ImageCard.svelte';
	import Heading from '$lib/components/Heading.svelte';

	export let slice: Content.ImageCardsSlice;

	const { pageBgColor, pageColor } = get(theme);
</script>

<Bounded
	tag="section"
	style="background-color: {pageBgColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class="grid gap-12" style="color: {pageColor}">
		{#if isFilled.richText(slice.primary.heading)}
			<Heading class="text-center">
				<PrismicText field={slice.primary.heading} />
			</Heading>
		{/if}
		<ul class="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
			{#each slice.primary.cards as card}
				<ImageCard {card} />
			{/each}
		</ul>
	</div>
</Bounded>
