<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import clsx from 'clsx';
	import { theme } from '$lib/stores/theme';
	import Carousel from './carousel.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	import Bounded from '$lib/components/Bounded.svelte';

	export let slice: Content.ImageSlice;
	export let index: number | undefined = undefined;
	export let slices: unknown[] | undefined = undefined;
	export let context: unknown = undefined;
	const p = slice.primary ?? ({} as any);

	$: anim = mapAnimationFromPrimary(slice.primary);
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
	{#if isFilled.image(p.image)}
		<div style="background-color: {$theme.pageBgColor};">
			<PrismicImage field={p.image} sizes="100vw" class="w-full" />
		</div>
	{/if}
	{#if slice.variation === 'carousel'}
		<Carousel
			images={p.images.map((item) => item.image)}
			animate={anim.animate}
			animationOptions={anim.options}
		/>
	{/if}
</Bounded>
