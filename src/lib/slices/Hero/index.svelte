<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage, PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	import Heading from './Heading.svelte';

	export let slice: Content.HeroSlice;

	const { pageBgColor, pageColor } = get(theme);
</script>

<section
	class="relative"
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
					class="rounded px-5 py-3 font-medium"
					style="background-color: {pageBgColor}; color: {pageColor};"
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
