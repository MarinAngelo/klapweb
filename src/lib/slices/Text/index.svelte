<script lang="ts">
	import type { Content } from '@prismicio/client';
	import clsx from 'clsx';
	import { theme } from '$lib/stores/theme';
	import { planFilter, isVisibleForPlan } from '$lib/stores/planFilter';

	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: Content.TextSlice;
	export let slices: any[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: bgColor = (slice.primary as any).bg_color || $theme.pageBgColor;
	$: textColor = (slice.primary as any).color || $theme.pageColor;
	$: visible = isVisibleForPlan((slice.primary as any).feature_gate, $planFilter);
	$: centered =
		(slice.variation === 'default' || slice.variation === 'ueberschrift') &&
		!!(slice.primary as any).centered;
</script>

{#if visible}
	<Bounded
		as="section"
		class="leading-relaxed"
		style="font-family: var(--page-font); --page-color: {textColor}; --page-bg-color: {bgColor}; background-color: {bgColor}; color: {textColor};"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		animate={anim.animate}
		animationOptions={anim.options}
	>
		<div
			class={clsx(
				slice.variation === 'twoColumns' && 'two-col md:columns-2 md:gap-16',
				centered && 'text-center'
			)}
		>
			<PrismicRichText field={slice.primary.text} />
		</div>
	</Bounded>
{/if}

<style>
	:global(.two-col > *:first-child) {
		margin-top: 0;
	}
	:global(.rt-invisible) {
		color: var(--page-bg-color) !important;
	}
</style>
