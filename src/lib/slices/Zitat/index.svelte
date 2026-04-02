<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicText } from '@prismicio/svelte';
	import clsx from 'clsx';

	import Bounded from '$lib/components/Bounded.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: Content.QuoteSlice;
	export let slices: unknown[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = (slice.primary as any).mobile_vollbreite ?? false;
</script>

<Bounded
	as="section"
	style="background-color: var(--page-bg-color); color: var(--page-color);"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class={mobileVollbreite ? 'overflow-x-clip' : ''}
>
	<div class={mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}>
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
	</div>
</Bounded>
