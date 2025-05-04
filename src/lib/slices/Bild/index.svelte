<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import clsx from 'clsx';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Carousel from './carousel.svelte';

	import Bounded from '$lib/components/Bounded.svelte';

	export let slice: Content.ImageSlice;
	export let index: number;
	
	const { pageBgColor } = get(theme);
</script>

<Bounded
	tag="section"
	class={clsx(index === 0 && 'pt-0 md:pt-0')}
    style={index === 0 ? `background-color: ${pageBgColor};` : `background-color: ${pageBgColor};`} 
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if isFilled.image(slice.primary.image)}
		<div style="background-color: {pageBgColor};">
			<PrismicImage field={slice.primary.image} sizes="100vw" class="w-full" />
		</div>
	{/if}
	{#if slice.variation === 'carousel'}
		<Carousel images={slice.primary.images.map(item => item.image)} />
	{/if}
</Bounded>
