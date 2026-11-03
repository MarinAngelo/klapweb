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
	$: innerApply = p.inner_apply ?? false;

	$: justifyClass =
		ausrichtung === 'Links'
			? 'justify-start'
			: ausrichtung === 'Rechts'
				? 'justify-end'
				: 'justify-center';
	$: alignClass =
		ausrichtung === 'Links' ? 'text-left' : ausrichtung === 'Rechts' ? 'text-right' : 'text-center';

	// CMS colors as scope variables (app.css › .color-scope)
	$: scopeStyle = [
		p.color && `--scope-color: ${p.color}`,
		`--scope-bg: ${innerApply ? 'var(--page-bg-color)' : p.bg_color || 'var(--page-bg-color)'}`
	]
		.filter(Boolean)
		.join('; ');

	$: hasSource = isFilled.keyText(p.source);
	$: hasQuote = isFilled.richText(p.quote);

	// Testimonials variation
	$: spalten = p.spalten ?? '3';
	$: gridColsClass =
		spalten === '2'
			? 'grid-cols-[repeat(auto-fill,minmax(min(100%,28rem),1fr))]'
			: spalten === '4'
				? 'grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))]'
				: 'grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))]';
	$: items = (slice as any).items ?? [];
</script>

<Bounded
	as="section"
	yPaddingSame={p.y_padding_same ?? false}
	yPaddingSize={p.y_padding}
	marginTopSize={p.margin_top}
	innerBackgroundColor={innerApply ? p.bg_color || 'var(--page-bg-color)' : undefined}
	class="color-scope"
	style={scopeStyle}
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
		<div class="grid gap-6 {gridColsClass}">
			{#each items as item}
				<div
					class="scope-tint flex flex-col rounded-2xl p-7 md:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.07)]"
					style:background-color={p.karten_bg || undefined}
				>
					{#if isFilled.richText(item.quote)}
						<blockquote class="flex-1 text-base leading-relaxed mb-6 opacity-90">
							<PrismicText field={item.quote} />
						</blockquote>
					{/if}
					{#if isFilled.keyText(item.source)}
						<div class="scope-border pt-4 mt-auto border-t">
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
			<div class="flex {justifyClass}">
				<div
					class="scope-border bg-page-bg w-full max-w-xl rounded-2xl border p-8 md:p-10 shadow-[0_4px_32px_rgba(0,0,0,0.10)]"
					style:background-color={p.bg_color || undefined}
				>
					<blockquote class="text-lg md:text-xl leading-relaxed mb-7 {alignClass}">
						<PrismicText field={p.quote} />
					</blockquote>
					{#if hasSource}
						<p class="font-semibold text-sm {alignClass}">{p.source}</p>
					{/if}
				</div>
			</div>
		{:else if stil === 'Modern'}
			<!-- ── Modern (Akzentlinie links) ── -->
			<div class="flex {justifyClass}">
				<div class="max-w-2xl w-full border-l-4 pl-7 md:pl-9" style:border-left-color={accentColor}>
					<blockquote class="text-xl md:text-2xl font-medium leading-snug mb-5 {alignClass}">
						<PrismicText field={p.quote} />
					</blockquote>
					{#if hasSource}
						<span class="text-sm font-semibold text-muted">{p.source}</span>
					{/if}
				</div>
			</div>
		{:else if stil === 'Gross'}
			<!-- ── Gross (Pull-Quote) ── -->
			<div class="flex {justifyClass}">
				<figure class="max-w-5xl w-full {alignClass}">
					<blockquote class="leading-tight mb-6 font-light text-[clamp(2rem,5vw,3.75rem)]">
						<span aria-hidden="true" style:color={accentColor}>&ldquo;</span><PrismicText
							field={p.quote}
						/><span aria-hidden="true" style:color={accentColor}>&rdquo;</span>
					</blockquote>
					{#if hasSource}
						<figcaption class="text-base font-medium {alignClass}">
							&mdash; {p.source}
						</figcaption>
					{/if}
				</figure>
			</div>
		{:else if stil === 'Minimal'}
			<!-- ── Minimal ── -->
			<div class="flex {justifyClass}">
				<figure class="max-w-2xl w-full {alignClass}">
					<blockquote class="text-lg md:text-xl leading-relaxed mb-4 text-muted">
						<PrismicText field={p.quote} />
					</blockquote>
					{#if hasSource}
						<figcaption class="text-sm text-muted">{p.source}</figcaption>
					{/if}
				</figure>
			</div>
		{:else}
			<!-- ── Klassisch (Standard) ── -->
			<div class="flex {justifyClass}">
				<figure class="max-w-3xl w-full {alignClass}">
					<div
						aria-hidden="true"
						class="leading-none select-none mb-2 text-[5rem] opacity-75 {alignClass}"
						style:color={accentColor}
					>
						&ldquo;
					</div>
					<blockquote class="text-xl md:text-2xl leading-snug font-medium mb-7">
						<PrismicText field={p.quote} />
					</blockquote>
					{#if hasSource}
						<figcaption class="font-semibold text-sm text-muted {alignClass}">
							{p.source}
						</figcaption>
					{/if}
				</figure>
			</div>
		{/if}
	{/if}
</Bounded>
