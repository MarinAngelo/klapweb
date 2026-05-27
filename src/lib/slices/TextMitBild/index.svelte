<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { headerHeight } from '$lib/stores/headerHeight';
	import { planFilter, isVisibleForPlan } from '$lib/stores/planFilter';

	import Bounded from '$lib/components/Bounded.svelte';
	import ImageTextGrid from '$lib/components/ImageTextGrid.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
	import { headingAnchor } from '$lib/actions/headingAnchor';
	import Button from '$lib/components/Button.svelte';

	export let slice: Content.TextWithImageSlice;
	export let slices: any[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;
	const p: any = slice.primary ?? {};

	let yPadding: 'base' | 'base-top' | 'none' | 'sm' | 'sm-top' | 'lg' | 'lg-top' = p.y_padding_same ? 'base' : 'base-top';

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

	const variation = slice.variation as string;
	const isBildLinks = variation === 'standardBildLinks';
	const isMulti = variation === 'multi';

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = (slice.primary as any).mobile_full_width ?? true;
	$: mobileImageFirst = (slice.primary as any).mobile_image_first ?? false;
	$: textCenterV = (slice.primary as any).text_center_v ?? false;
	$: textCenterH = (slice.primary as any).text_center_h ?? false;
	$: fullscreen = (slice.primary as any).fullscreen ?? false;
	$: visible = isVisibleForPlan((slice.primary as any).feature_gate, $planFilter);

	const rowGapMap: Record<string, string> = {
		'kein Abstand': '0',
		'wenig': '1rem',
		'mittel': '3rem',
		'gross': '6rem'
	};
	$: columnGapVal = (p as any).column_gap ?? 'mittel';
	$: rowGap = isMulti
		? columnGapVal === 'kein'
			? '0'
			: (rowGapMap[(p as any).row_gap ?? 'mittel'] ?? '3rem')
		: '0';
	$: multiItems = isMulti ? ((slice as any).items ?? []) : [];
	$: multiItemsWithImages = multiItems.map((item: any) => ({
		...item,
		sliderImages: [item.image, item.image_2, item.image_3, item.image_4].filter((img: any) => isFilled.image(img))
	}));
	$: imageRound = !!(slice.primary as Record<string, unknown>).image_round;
	$: lightbox = !!(slice.primary as Record<string, unknown>).lightbox;
	$: isFullWidth = !!(slice.primary as Record<string, unknown>).full_width;

	const textPadMap: Record<string, string> = {
		kein: '0',
		klein: '1rem',
		mittel: '2rem',
		gross: '4rem'
	};
	$: textPad = textPadMap[(p as any).text_padding ?? 'mittel'] ?? '2rem';

	const ptMobMap: Record<string, string> = { 'kein Abstand': 'pt-0', 'wenig': 'pt-8', 'mittel': 'pt-20', 'gross': 'pt-32' };
	const ptDeskMap: Record<string, string> = { 'kein Abstand': 'md:pt-0', 'wenig': 'md:pt-10', 'mittel': 'md:pt-28', 'gross': 'md:pt-48' };
	const pbMobMap: Record<string, string> = { 'kein Abstand': 'pb-0', 'wenig': 'pb-8', 'mittel': 'pb-20', 'gross': 'pb-32' };
	const pbDeskMap: Record<string, string> = { 'kein Abstand': 'md:pb-0', 'wenig': 'md:pb-10', 'mittel': 'md:pb-28', 'gross': 'md:pb-48' };

	$: yPaddingMobileVal = (p as any).y_padding_mobile as string | null | undefined;
	$: computedPaddingTopClass = yPaddingMobileVal
		? [ptMobMap[yPaddingMobileVal], p.y_padding ? ptDeskMap[p.y_padding as string] : ''].filter(Boolean).join(' ')
		: undefined;
	$: computedPaddingBottomClass = yPaddingMobileVal
		? (p.y_padding_same
			? [pbMobMap[yPaddingMobileVal], p.y_padding ? pbDeskMap[p.y_padding as string] : ''].filter(Boolean).join(' ')
			: '')
		: undefined;
</script>

{#if visible}
{#if isMulti}
<Bounded
	as="section"
	yPadding={yPadding}
	fullWidth={isFullWidth}
	noPadding={isFullWidth}
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	style="background-color: {p.bg_color || 'var(--page-bg-color)'}; color: {p.color || 'var(--page-color)'};{p.color ? ` --page-color: ${p.color};` : ''}"
>
	{#if p.section_title}
		<h2 use:headingAnchor class="text-center mb-16">{p.section_title}</h2>
	{/if}
	<div class="flex flex-col" style="gap: {rowGap};">
		{#each multiItemsWithImages as item, i}
			<ImageTextGrid
				image={isFilled.image(item.image) ? item.image : null}
				images={item.sliderImages.length > 1 ? item.sliderImages : undefined}
				text={item.text}
				imageLeft={item.bild_links ?? false}
				imageBgColor={p.bg_color || 'var(--page-bg-color)'}
				imageRound={imageRound}
				noRound={!imageRound}
				mobileTextFirst={true}
				columnGap={columnGapVal}
				mobilePadding={textPad}
				mobilePaddingTop={textPad}
				desktopPadding={textPad}
				desktopPaddingY={i === 0 ? '0' : textPad}
				{textCenterV}
				{textCenterH}
				{lightbox}
				fullscreen={false}
			>
				{#if item.button_text && isFilled.link(item.button_link)}
					<Button link={item.button_link} text={item.button_text} mb={false} />
				{/if}
			</ImageTextGrid>
		{/each}
	</div>
</Bounded>
{:else}
<Bounded
	as="section"
	yPadding={fullscreen ? 'none' : yPadding}
	fullHeight={fullscreen}
	noPadding={mobileVollbreite}
	paddingTopClass={fullscreen ? undefined : computedPaddingTopClass}
	paddingBottomClass={fullscreen ? undefined : computedPaddingBottomClass}
	style="background-color: {p.bg_color || 'var(--page-bg-color)'}; color: {p.color ||
		'var(--page-color)'};{p.color ? ` --page-color: ${p.color};` : ''}{fullscreen
		? ` min-height: calc(100vh - ${$headerHeight}px);`
		: ''}"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class={mobileVollbreite ? 'md:px-6' : ''}
>
	<div class={fullscreen ? 'flex-1 flex items-center' : ''}>
		<ImageTextGrid
			image={isFilled.image(p.image) ? p.image : null}
			text={p.text}
			imageLeft={isBildLinks}
			imageBgColor={p.bg_color || 'var(--page-bg-color)'}
			imageRound={p.image_round}
			mobilePadding={mobileVollbreite ? '1.5rem' : ''}
			noRoundMobile={mobileVollbreite}
			mobileTextFirst={!isBildLinks && mobileVollbreite}
			{lightbox}
			{textCenterV}
			{textCenterH}
			{fullscreen}
		>
			{#if p.buttonText && isFilled.link(p.buttonLink)}
				<Button link={p.buttonLink} text={p.buttonText} mb={false} />
			{/if}
		</ImageTextGrid>
	</div>
</Bounded>
{/if}
{/if}
