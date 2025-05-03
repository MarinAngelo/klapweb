<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicText } from '@prismicio/svelte';
	import clsx from 'clsx';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import Bounded from '$lib/components/Bounded.svelte';

	export let slice: Content.QuoteSlice;

	const { pageBgColor, pageColor } = get(theme);
</script>

<Bounded
	as="section"
	style="background-color: {pageBgColor}; color: {pageColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if isFilled.richText(slice.primary.quote)}
		<figure class="grid gap-6">
			<blockquote>
				<p
					class={clsx(
						'text-xl font-medium leading-tight md:text-xl md:leading-tight',
						!isFilled.keyText(slice.primary.source) && 'text-center'
					)}
				>
					<span class="-ml-3.5 select-none md:-ml-5"> &ldquo; </span>
					<PrismicText field={slice.primary.quote} />
					<span class="select-none">&rdquo;</span>
				</p>
			</blockquote>
			{#if isFilled.keyText(slice.primary.source)}
				<figcaption class="text-right">
					&mdash; {slice.primary.source}
				</figcaption>
			{/if}
		</figure>
	{/if}
</Bounded>
