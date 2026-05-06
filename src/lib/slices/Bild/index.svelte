<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import clsx from 'clsx';
	import Carousel from './carousel.svelte';
	import VorherNachher from './vorher-nachher.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	import Bounded from '$lib/components/Bounded.svelte';

	export let slice: Content.ImageSlice;
	export let index: number | undefined = undefined;
	export const slices: any[] | undefined = undefined;
	export const context: unknown = undefined;

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = (slice.primary as any).mobile_full_width ?? false;
	$: primaryVN = slice.primary as any;
	$: isVorherNachher = (slice.variation as string) === 'vorherNachher';
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
		{#if isVorherNachher}
			<VorherNachher
				bildLinks={primaryVN.bild_links}
				textLinks={primaryVN.text_links ?? null}
				bildRechts={primaryVN.bild_rechts}
				textRechts={primaryVN.text_rechts ?? null}
				animate={anim.animate}
				animationOptions={anim.options}
			/>
		{:else if isFilled.image(slice.primary.image)}
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
