<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage, PrismicLink } from '@prismicio/svelte';
	import clsx from 'clsx';

	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	import Heading from './Heading.svelte';

	export let slice: Content.HeroSlice;
	export let prismicTheme;
	console.log("🚀 ~ prismicTheme:", prismicTheme)

	const bannerTop = prismicTheme.data?.banner_top || false;
	const pageBgColor = prismicTheme.data?.page_bg_color || 'var(--page-bg-color)';
	const pageColor = prismicTheme.data?.page_color || 'var(--page-color)';

</script>

<section
	class={clsx('relative', { 'banner-position-top': bannerTop })}
	style="background-color: {pageBgColor}; color: {pageColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if isFilled.image(slice.primary.backgroundImage)}
		<PrismicImage
			field={slice.primary.backgroundImage}
			alt=""
			class="absolute inset-0 h-full w-full pointer-events-none select-none object-cover opacity-40"
		/>
	{/if}
	<Bounded tag="div" yPadding="lg" class="relative">
		<div class="grid justify-items-center gap-8">
			<div class="max-w-2xl text-center">
				<PrismicRichText
					field={slice.primary.text}
					components={{
						heading1: Heading
					}}
				/>
			</div>
			{#if isFilled.link(slice.primary.buttonLink)}
				<PrismicLink
					field={slice.primary.buttonLink}
					class="rounded bg-white px-5 py-3 font-medium text-slate-800"
				>
					{slice.primary.buttonText}
				</PrismicLink>
			{/if}
		</div>
	</Bounded>
</section>

<style>
	.banner-height {
		/* Höhe des Bannerbereichs */
		height: 100vh;
	}
</style>
