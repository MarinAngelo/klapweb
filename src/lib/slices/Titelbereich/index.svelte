<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage, PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { headerHeight } from '$lib/stores/headerHeight';
	import { derived } from 'svelte/store';
	import { convertNumber } from '$lib/utils';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Heading from './Heading.svelte';

	export let slice: Content.HeroSlice;

	const overlayColor = slice.primary.overlay_color || 'var(--overlay-color)';
	const overlayOpacity = convertNumber(slice.primary.overlay_opacity ?? 99) || 0.99;
	const color = slice.primary.color || 'var(--text-color)';

	const bannerHeight = derived([theme, headerHeight], ([$theme, $headerHeight]) => {
		const raw = slice.primary.banner_height ?? '100%';
		const clean = raw.replace(/\s/g, '');
		const bannerTop = $theme.bannerTop;

		if (!bannerTop && (!$headerHeight || $headerHeight === 0)) {
			return 'auto';
		}

		switch (clean) {
			case '100%':
				return bannerTop ? '100vh' : `calc(100vh - ${$headerHeight}px)`;
			case '50%':
				return '50vh';
			case '33%':
				return '33vh';
			default:
				return '100vh';
		}
	});
</script>

<section
	class="relative z-0 overflow-visible"
	style="background-color: {overlayColor}; color: {color}; height: {$bannerHeight};"
>
	{#if isFilled.image(slice.primary.backgroundImage)}
		<PrismicImage
			field={slice.primary.backgroundImage}
			alt=""
			class="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
			style="opacity: {overlayOpacity};"
		/>
	{/if}

	<Bounded tag="div" yPadding="lg" class="relative z-10">
		<div class="grid justify-items-center gap-8">
			<div class="max-w-2xl text-center">
				<PrismicRichText
					field={slice.primary.text}
					components={{ heading1: Heading }}
				/>
			</div>

			{#if isFilled.link(slice.primary.button_link)}
				<PrismicLink
					field={slice.primary.button_link}
					class="rounded px-5 py-3 font-medium"
					style="background-color: {theme.pageBgColor}; color: {theme.pageColor};"
				>
					{slice.primary.button_text}
				</PrismicLink>
			{/if}
		</div>
	</Bounded>
</section>
