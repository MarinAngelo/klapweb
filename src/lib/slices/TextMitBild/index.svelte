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
	const p = slice.primary ?? ({} as any);

	let yPadding = p.y_padding_same ? 'base' : 'base-top';

	if (p.y_padding) {
		switch (p.y_padding) {
			case 'kein Abstand':
				yPadding = 'none';
				break;
			case 'wenig':
				yPadding = p.y_padding_same ? 'sm' : 'sm-top';
				break;
			case 'mittel':
				yPadding = p.y_padding_same ? 'base' : 'base-top';
				break;
			case 'gross':
				yPadding = p.y_padding_same ? 'lg' : 'lg-top';
				break;
		}
	}

	const isBildLinks = slice.variation === 'standardBildLinks';

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = (slice.primary as any).mobile_vollbreite ?? false;
	$: textCenterV = (slice.primary as any).text_center_v ?? false;
	$: textCenterH = (slice.primary as any).text_center_h ?? false;
</script>

<Bounded
	as="section"
	{yPadding}
	style="background-color: {p.bg_color || $theme.pageBgColor}; color: {p.color ||
		$theme.pageColor}; --page-color: {p.color || $theme.pageColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class={mobileVollbreite ? 'overflow-x-clip' : ''}
>
	<div class={mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}>
		<ImageTextGrid
			image={isFilled.image(p.image) ? p.image : null}
			text={p.text}
			imageLeft={isBildLinks}
			imageBgColor={p.bg_color || $theme.pageBgColor}
			imageRound={p.image_round}
			{theme}
			textCenterV={textCenterV}
			textCenterH={textCenterH}
		/>
	</div>
</Bounded>
