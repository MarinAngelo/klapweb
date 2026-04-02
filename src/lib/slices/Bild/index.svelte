<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import clsx from 'clsx';
	import Carousel from './carousel.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	import Bounded from '$lib/components/Bounded.svelte';

	export let slice: Content.ImageSlice;
	export let index: number | undefined = undefined;
	export let slices: unknown[] | undefined = undefined;
	export let context: unknown = undefined;

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = (slice.primary as any).mobile_vollbreite ?? false;
</script>

<Bounded
	tag="section"
	class={clsx(index === 0 && 'pt-0 md:pt-0', mobileVollbreite && 'overflow-x-clip')}
	style="background-color: var(--page-bg-color);"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	<div class={mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}>
		{#if isFilled.image(slice.primary.image)}
			<div style="background-color: var(--page-bg-color);">
				<PrismicImage field={slice.primary.image} sizes="100vw" class="w-full" />
			</div>
		{/if}
		{#if slice.variation === 'carousel'}
			<Carousel
				images={slice.items.map((item) => item.image)}
				animate={anim.animate}
				animationOptions={anim.options}
			/>
		{/if}
	</div>
</Bounded>
