<script lang="ts">
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { theme } from '$lib/stores/theme';
	import { reveal } from '$lib/actions/reveal';

	export let slice: {
		primary: Record<string, unknown>;
		items: Record<string, unknown>[];
		slice_type?: string;
		variation?: string;
	};
	const p = slice.primary ?? {};

	$: bgColor = (p.bg_color as string) || $theme.pageBgColor;
	$: color = (p.color as string) || $theme.pageColor;
	$: lineColor = (p.line_color as string) || color;
	$: animate = (p.animate as boolean) !== false;

	const itemFadeIn = { direction: 'up' as const, distance: '24px', duration: 1200, delay: 100 };
	const itemNoAnim = { direction: 'none' as const };

	$: titleText = (p.title as { text: string }[] | undefined)?.[0]?.text ?? '';
	$: items = (slice.items ?? []) as {
		date?: string;
		title?: string;
		subtitle?: string;
		description?: import('@prismicio/client').RichTextField;
	}[];
</script>

<Bounded
	tag="section"
	style="background-color: {bgColor}; color: {color}; --page-color: {color};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	{#if titleText}
		<h2 class="text-center mb-12">{titleText}</h2>
	{/if}

	<div class="relative">
		<!-- Vertikale Linie: links auf Mobile, Mitte auf Desktop -->
		<div
			class="absolute left-5 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-px"
			style="background-color: {lineColor}; opacity: 0.3;"
			aria-hidden="true"
		></div>

		<ol class="relative space-y-0 list-none p-0 m-0">
			{#each items as item, i}
				{@const isLeft = i % 2 === 0}
				<li use:reveal={animate ? itemFadeIn : itemNoAnim} class="relative py-8">

					<!-- ── MOBILE Layout ── -->
					<div class="md:hidden pl-14">
						<!-- Punkt auf der Linie (absolut) -->
						<div
							class="absolute left-[14px] top-10 w-3 h-3 rounded-full border-2 z-10"
							style="background-color: {bgColor}; border-color: {lineColor};"
						></div>

						<!-- Datum: eigene Zeile -->
						{#if item.date}
							<span
								class="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3"
								style="background-color: {lineColor}; color: {bgColor}; opacity: 0.85;"
								>{item.date}</span
							>
						{/if}

						<!-- Text: volle Breite -->
						{#if item.title}
							<h3 class="mb-1">{item.title}</h3>
						{/if}
						{#if item.subtitle}
							<p class="text-sm mb-2 opacity-70">{item.subtitle}</p>
						{/if}
						{#if item.description}
							<PrismicRichText field={item.description} />
						{/if}
					</div>

					<!-- ── DESKTOP Layout ── -->
					<div class="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:gap-x-6 md:items-center">
						<!-- Linke Spalte -->
						<div class="text-right">
							{#if isLeft}
								<div class="inline-block max-w-sm text-left">
									{#if item.title}<h3 class="mb-1">{item.title}</h3>{/if}
									{#if item.subtitle}<p class="text-sm mb-2 opacity-70">{item.subtitle}</p>{/if}
									{#if item.description}<PrismicRichText field={item.description} />{/if}
								</div>
							{/if}
						</div>

						<!-- Mitte: Punkt + Datum -->
						<div class="flex flex-col items-center gap-1 z-10">
							<div
								class="w-3 h-3 rounded-full border-2 shrink-0"
								style="background-color: {bgColor}; border-color: {lineColor};"
							></div>
							{#if item.date}
								<span
									class="text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded-full"
									style="background-color: {lineColor}; color: {bgColor}; opacity: 0.85;"
									>{item.date}</span
								>
							{/if}
						</div>

						<!-- Rechte Spalte -->
						<div>
							{#if !isLeft}
								<div class="max-w-sm">
									{#if item.title}<h3 class="mb-1">{item.title}</h3>{/if}
									{#if item.subtitle}<p class="text-sm mb-2 opacity-70">{item.subtitle}</p>{/if}
									{#if item.description}<PrismicRichText field={item.description} />{/if}
								</div>
							{/if}
						</div>
					</div>

				</li>
			{/each}
		</ol>
	</div>
</Bounded>
