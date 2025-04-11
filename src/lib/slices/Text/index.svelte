<script lang="ts">
	import type { Content } from '@prismicio/client';
	import clsx from 'clsx';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	export let slice: Content.TextSlice;

	const { pageColor, pageBgColor } = get(theme);
</script>

<Bounded
	as="section"
	class="leading-relaxed"
	style="color: {pageColor}; background-color: {pageBgColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class={clsx(slice.variation === 'twoColumns' && 'md:columns-2 md:gap-6')}>
		<PrismicRichText field={slice.primary.text} />
	</div>
</Bounded>
