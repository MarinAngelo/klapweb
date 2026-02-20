<script lang="ts">
	import type { Content } from '@prismicio/client';
	import clsx from 'clsx';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import { useOpenIndex } from '$lib/utils/useOpenIndex';

	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { mapAnimation } from '$lib/utils/animationMapper';

	export let slice: Content.TextSlice;
	export let slices;
	export let context;
	export let index;

	const { pageColor, pageBgColor } = get(theme);

	$: anim = mapAnimation(
		slice.primary.animate,
		slice.primary.anim_direction,
		slice.primary.anim_delay,
		slice.primary.anim_duration
	);
</script>

<Bounded
	as="section"
	class="leading-relaxed"
	style="color: {pageColor}; background-color: {pageBgColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	<div class={clsx(slice.variation === 'twoColumns' && 'two-col md:columns-2 md:gap-6')}>
		<PrismicRichText field={slice.primary.text} />
	</div>
</Bounded>

<style>
	:global(.two-col > *:first-child) {
		margin-top: 0;
	}
</style>
