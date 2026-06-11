<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicText } from '@prismicio/svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: Content.QuoteSlice;
	export let slices: any[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	const p: any = slice.primary;
	const isTestimonials = (slice.variation as string) === 'testimonials';

	$: anim = mapAnimationFromPrimary(p);
	$: stil = p.stil ?? 'Klassisch';
	$: ausrichtung = p.ausrichtung ?? 'Mitte';
	$: accentColor = p.anker_farbe || 'currentColor';

	$: yPadding = (() => {
		const same = p.y_padding_same ?? false;
		switch (p.y_padding) {
			case 'kein Abstand': return 'none';
			case 'wenig': return same ? 'sm' : 'sm-top';
			case 'gross': return same ? 'lg' : 'lg-top';
			default: return same ? 'base' : 'base-top';
		}
	})() as 'none' | 'sm' | 'sm-top' | 'base' | 'base-top' | 'lg' | 'lg-top';

	$: justifyStyle =
		ausrichtung === 'Links' ? 'flex-start' :
		ausrichtung === 'Rechts' ? 'flex-end' : 'center';
	$: textAlign =
		ausrichtung === 'Links' ? 'left' :
		ausrichtung === 'Rechts' ? 'right' : 'center';

	$: hasSource = isFilled.keyText(p.source);
	$: hasQuote = isFilled.richText(p.quote);

	// Testimonials variation
	$: spalten = p.spalten ?? '3';
	$: gridColsStyle =
		spalten === '2' ? 'grid-template-columns: repeat(auto-fill, minmax(min(100%, 28rem), 1fr))' :
		spalten === '4' ? 'grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr))' :
		'grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr))';
	$: items = (slice as any).items ?? [];
</script>

<Bounded
	as="section"
	yPadding={yPadding}
	style="background-color: {p.bg_color || 'var(--page-bg-color)'}; color: {p.color || 'var(--page-color)'};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>

{#if isTestimonials}
	<!-- ═══════════════════════════════════ TESTIMONIALS ═══════════════════════════════════ -->
	{#if isFilled.richText(p.heading)}
		<h2 class="text-center mb-12"><PrismicText field={p.heading} /></h2>
	{/if}
	<div class="grid gap-6" style="{gridColsStyle};">
		{#each items as item}
			<div
				class="flex flex-col rounded-2xl p-7 md:p-8"
				style="background-color: {p.karten_bg || 'color-mix(in srgb, currentColor 6%, transparent)'}; box-shadow: 0 2px 16px rgba(0,0,0,0.07);"
			>
				{#if isFilled.richText(item.quote)}
					<blockquote class="flex-1 text-base leading-relaxed mb-6 opacity-90">
						<PrismicText field={item.quote} />
					</blockquote>
				{/if}
				{#if isFilled.keyText(item.source)}
					<div class="pt-4 mt-auto border-t" style="border-color: color-mix(in srgb, currentColor 12%, transparent);">
						<p class="font-semibold text-sm leading-tight">{item.source}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>

{:else if hasQuote}
	<!-- ═════════════════════════════════ EINZELZITAT ═════════════════════════════════ -->

	{#if stil === 'Karte'}
		<!-- ── Karte ── -->
		<div style="display:flex; justify-content:{justifyStyle};">
			<div
				class="w-full max-w-xl rounded-2xl p-8 md:p-10"
				style="background-color: {p.bg_color || 'var(--page-bg-color)'}; box-shadow: 0 4px 32px rgba(0,0,0,0.10); border: 1px solid color-mix(in srgb, currentColor 10%, transparent);"
			>
				<blockquote class="text-lg md:text-xl leading-relaxed mb-7" style="text-align:{textAlign};">
					<PrismicText field={p.quote} />
				</blockquote>
				{#if hasSource}
					<p class="font-semibold text-sm" style="text-align:{textAlign};">{p.source}</p>
				{/if}
			</div>
		</div>

	{:else if stil === 'Modern'}
		<!-- ── Modern (Akzentlinie links) ── -->
		<div style="display:flex; justify-content:{justifyStyle};">
			<div class="max-w-2xl w-full pl-7 md:pl-9" style="border-left: 4px solid {accentColor};">
				<blockquote class="text-xl md:text-2xl font-medium leading-snug mb-5" style="text-align:{textAlign};">
					<PrismicText field={p.quote} />
				</blockquote>
				{#if hasSource}
					<span class="text-sm font-semibold opacity-60">{p.source}</span>
				{/if}
			</div>
		</div>

	{:else if stil === 'Gross'}
		<!-- ── Gross (Pull-Quote) ── -->
		<div style="display:flex; justify-content:{justifyStyle};">
			<figure class="max-w-5xl w-full" style="text-align:{textAlign};">
				<blockquote class="leading-tight mb-6 font-light" style="font-size: clamp(2rem, 5vw, 3.75rem);">
					<span aria-hidden="true" style="color:{accentColor};">&ldquo;</span><PrismicText
						field={p.quote}
					/><span aria-hidden="true" style="color:{accentColor};">&rdquo;</span>
				</blockquote>
				{#if hasSource}
					<figcaption class="text-base font-medium" style="text-align:{textAlign};">
						&mdash; {p.source}
					</figcaption>
				{/if}
			</figure>
		</div>

	{:else if stil === 'Minimal'}
		<!-- ── Minimal ── -->
		<div style="display:flex; justify-content:{justifyStyle};">
			<figure class="max-w-2xl w-full" style="text-align:{textAlign};">
				<blockquote class="text-lg md:text-xl leading-relaxed mb-4 opacity-85">
					<PrismicText field={p.quote} />
				</blockquote>
				{#if hasSource}
					<figcaption class="text-sm opacity-45">{p.source}</figcaption>
				{/if}
			</figure>
		</div>

	{:else}
		<!-- ── Klassisch (Standard) ── -->
		<div style="display:flex; justify-content:{justifyStyle};">
			<figure class="max-w-3xl w-full" style="text-align:{textAlign};">
				<div
					aria-hidden="true"
					class="leading-none select-none mb-2"
					style="font-size: 5rem; color:{accentColor}; opacity:0.75; text-align:{textAlign};"
				>&ldquo;</div>
				<blockquote class="text-xl md:text-2xl leading-snug font-medium mb-7">
					<PrismicText field={p.quote} />
				</blockquote>
				{#if hasSource}
					<figcaption class="font-semibold text-sm opacity-60" style="text-align:{textAlign};">
						{p.source}
					</figcaption>
				{/if}
			</figure>
		</div>
	{/if}

{/if}
</Bounded>
