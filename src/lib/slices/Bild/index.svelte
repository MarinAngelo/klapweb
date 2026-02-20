<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import clsx from 'clsx';
	import { theme } from '$lib/stores/theme';
	import Carousel from './carousel.svelte';
	import { mapAnimation } from '$lib/utils/animationMapper';

	import Bounded from '$lib/components/Bounded.svelte';

	export let slice: Content.ImageSlice;
	export let index: number | undefined = undefined;
	export let slices: unknown[] | undefined = undefined;
	export let context: unknown = undefined;

	$: anim = mapAnimation(
		slice.primary.animate,
		slice.primary.anim_direction,
		slice.primary.anim_delay,
		slice.primary.anim_duration
	);
</script>

<Bounded
	tag="section"
	class={clsx(index === 0 && 'pt-0 md:pt-0')}
	style="background-color: {$theme.pageBgColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	{#if isFilled.image(slice.primary.image)}
		<div style="background-color: {$theme.pageBgColor};">
			<PrismicImage field={slice.primary.image} sizes="100vw" class="w-full" />
		</div>
	{/if}
	{#if slice.variation === 'carousel'}
		<Carousel
			images={slice.primary.images.map((item) => item.image)}
			animate={anim.animate}
			animationOptions={anim.options}
		/>
	{/if}
</Bounded>
