<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicText } from '@prismicio/svelte';
	import clsx from 'clsx';
	import { theme } from '$lib/stores/theme';

	import Bounded from '$lib/components/Bounded.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: Content.QuoteSlice;
	export let slices: unknown[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;
	const p = slice.primary ?? ({} as any);

	$: anim = mapAnimationFromPrimary(slice.primary);
</script>

<Bounded
	as="section"
	style="background-color: {$theme.pageBgColor}; color: {$theme.pageColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	{#if isFilled.richText(p.quote)}
		<figure class="grid gap-6">
			<blockquote>
				<p
					class={clsx(
						'text-xl font-medium leading-tight md:text-xl md:leading-tight',
						!isFilled.keyText(p.source) && 'text-center'
					)}
				>
					<span class="-ml-3.5 select-none md:-ml-5"> &ldquo; </span>
					<PrismicText field={p.quote} />
					<span class="select-none">&rdquo;</span>
				</p>
			</blockquote>
			{#if isFilled.keyText(p.source)}
				<figcaption class="text-right">
					&mdash; {p.source}
				</figcaption>
			{/if}
		</figure>
	{/if}
</Bounded>
