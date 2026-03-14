<script lang="ts">
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import { theme } from '$lib/stores/theme';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import ImageTextGrid from '$lib/components/ImageTextGrid.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
	import { useOpenIndex } from '$lib/utils/useOpenIndex';
	import { reveal } from '$lib/actions/reveal';

	export let slice: Content.AccordionSlice;
	export let context: any = {};
	const p = slice.primary ?? ({} as any);

	const { openIndex, toggleItem } = useOpenIndex(p?.erstes_item_ausgeklappt === false ? null : 0);

	// Animation aus CMS-Feldern mappen
	$: anim = mapAnimationFromPrimary(slice.primary);

	const STAGGER_MS = 150;

	$: leistungenItems = (context?.pageLeistungen ?? []) as Array<{ leistung: any }>;
	$: isLeistungen = (slice.variation as string) === 'leistungen';
</script>

<Bounded
	tag="section"
	style="background-color: {$theme.pageBgColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	<div class="flex flex-col gap-4" style="color: {$theme.pageColor}">
		{#if p.heading}
			<PrismicRichText field={p.heading} />
		{/if}

		{#if p.description}
			<div class="mb-4">
				<PrismicRichText field={p.description} />
			</div>
		{/if}

		{#if isLeistungen}
		{#each leistungenItems as item, index}
			{@const leistung = item.leistung?.data ?? {}}
			<div
				use:reveal={anim.animate
					? { ...anim.options, delay: (anim.options.delay ?? 500) + index * STAGGER_MS }
					: { direction: 'none' }}
				class="border-b pb-4"
				style="border-color: {$theme.pageColor}"
			>
				<button
					class="text-2xl font-semibold tracking-tight inline-flex items-center justify-between w-full mt-3"
					aria-haspopup="true"
					aria-expanded={$openIndex === index}
					on:click={() => toggleItem(index)}
				>
					{leistung.label ?? ''}
					<svg
						class="w-4 h-4 ml-1 fill-current transform transition-transform"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						class:rotate-180={$openIndex === index}
					>
						<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
					</svg>
				</button>

				{#if $openIndex === index}
					<div class="mt-2 transition-all">
						{#if leistung.beschreibung?.length}
							<PrismicRichText field={leistung.beschreibung} />
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	{:else}
		{#each (p.accordion_items ?? []) as item, index}
			<div
				use:reveal={anim.animate
					? { ...anim.options, delay: (anim.options.delay ?? 500) + index * STAGGER_MS }
					: { direction: 'none' }}
				class="border-b pb-4"
				style="border-color: {$theme.pageColor}"
			>
				<button
					class="text-2xl font-semibold tracking-tight inline-flex items-center justify-between w-full mt-3"
					aria-haspopup="true"
					aria-expanded={$openIndex === index}
					on:click={() => toggleItem(index)}
				>
					{item.label}
					<svg
						class="w-4 h-4 ml-1 fill-current transform transition-transform"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						class:rotate-180={$openIndex === index}
					>
						<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
					</svg>
				</button>

				{#if $openIndex === index}
					<div class="mt-2 transition-all">
						{#if slice.variation === 'bildUndText'}
							<ImageTextGrid
								image={'image' in item ? item.image : null}
								text={item.content}
								imageLeft={'standardBildLinks' in item ? item.standardBildLinks : false}
								{theme}
							/>
						{:else}
							<PrismicRichText field={item.content} />
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	{/if}
	</div>
</Bounded>

<style>
	button {
		text-align: left;
	}

	/* Zwingt Listen-Stile zurück */
	:global([data-slice-type='accordion'] ol) {
		list-style-type: decimal !important;
		padding-left: 1.5rem !important;
		margin-bottom: 1rem;
	}

	:global([data-slice-type='accordion'] li) {
		padding-left: 0.5rem;
	}
</style>
