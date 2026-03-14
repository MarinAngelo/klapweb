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
	const p = slice.primary ?? ({} as any);

	$: anim = mapAnimationFromPrimary(slice.primary);
</script>

<Bounded
	as="section"
	class="leading-relaxed"
	style="color: {$theme.pageColor}; background-color: {$theme.pageBgColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	<div class={clsx(slice.variation === 'twoColumns' && 'two-col md:columns-2 md:gap-6')}>
		<PrismicRichText field={p.text} />
	</div>
</Bounded>

<style>
	:global(.two-col > *:first-child) {
		margin-top: 0;
	}
</style>
