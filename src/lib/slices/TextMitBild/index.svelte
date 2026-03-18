<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { theme } from '$lib/stores/theme';

	import Bounded from '$lib/components/Bounded.svelte';
	import ImageTextGrid from '$lib/components/ImageTextGrid.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: Content.TextWithImageSlice;
	export let slices: unknown[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	let yPadding = slice.primary.y_padding_same ? 'base' : 'base-top';

	if (slice.primary.y_padding) {
		switch (slice.primary.y_padding) {
			case 'kein Abstand':
				yPadding = 'none';
				break;
			case 'wenig':
				yPadding = slice.primary.y_padding_same ? 'sm' : 'sm-top';
				break;
			case 'mittel':
				yPadding = slice.primary.y_padding_same ? 'base' : 'base-top';
				break;
			case 'gross':
				yPadding = slice.primary.y_padding_same ? 'lg' : 'lg-top';
				break;
		}
	}

	const isBildLinks = slice.variation === 'standardBildLinks';

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = (slice.primary as any).mobile_vollbreite ?? false;
</script>

<Bounded
	as="section"
	{yPadding}
	style="background-color: {slice.primary.bg_color || $theme.pageBgColor}; color: {slice.primary.color || $theme.pageColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class="{mobileVollbreite ? 'overflow-x-hidden' : ''}"
>
	<div class="{mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}">
	<ImageTextGrid
		image={isFilled.image(slice.primary.image) ? slice.primary.image : null}
		text={slice.primary.text}
		imageLeft={isBildLinks}
		imageBgColor={slice.primary.bg_color || $theme.pageBgColor}
		imageRound={slice.primary.image_round}
		{theme}
	/>
	</div>
</Bounded>
