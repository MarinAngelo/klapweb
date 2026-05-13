<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import clsx from 'clsx';
	import Carousel from './carousel.svelte';
	import VorherNachher from './vorher-nachher.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	import Bounded from '$lib/components/Bounded.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';

	export let slice: Content.ImageSlice;
	export let index: number | undefined = undefined;
	export let slices: any[] | undefined = undefined;
	export let context: unknown = undefined;

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: p = slice.primary as any;
	$: mobileVollbreite = p.mobile_full_width ?? false;
	$: lightbox = p.lightbox ?? false;
	$: primaryVN = p;
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
		{:else if isFilled.image(p.image)}
			<div style="background-color: var(--page-bg-color);">
				{#if lightbox}
					<Lightbox src={p.image.url ?? ''} alt={p.image.alt ?? ''}>
						<PrismicImage field={p.image} sizes="100vw" class="w-full" />
					</Lightbox>
				{:else}
					<PrismicImage field={p.image} sizes="100vw" class="w-full" />
				{/if}
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
