<script lang="ts">
	import type { Content } from '@prismicio/client';
	import clsx from 'clsx';
	import { theme } from '$lib/stores/theme';

	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: Content.TextSlice;
	export let slices: unknown[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = (slice.primary as any).mobile_vollbreite ?? false;
	$: bgColor = (slice.primary as any).bg_color || $theme.pageBgColor;
	$: textColor = (slice.primary as any).color || $theme.pageColor;
</script>

<Bounded
	as="section"
	class="leading-relaxed {mobileVollbreite ? 'overflow-x-clip' : ''}"
	style="--page-color: {textColor}; --page-bg-color: {bgColor}; background-color: {bgColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	<div
		class="{clsx(
			slice.variation === 'twoColumns' && 'two-col md:columns-2 md:gap-6'
		)} {mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}"
	>
		<PrismicRichText field={slice.primary.text} />
	</div>
</Bounded>

<style>
	:global(.two-col > *:first-child) {
		margin-top: 0;
	}
</style>
