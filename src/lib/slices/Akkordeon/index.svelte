<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicText } from '@prismicio/svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	export let slice: Content.AccordionSlice;

	// Zustand für geöffnete Items
	let openIndex: number | null = null;

	// Funktion zum Umschalten des geöffneten Zustands
	function toggleItem(index: number) {
		openIndex = openIndex === index ? null : index;
	}

	const { pageBgColor, pageColor } = get(theme);
</script>

<Bounded
	tag="section"
	style="background-color: {pageBgColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class="flex-col gap-4" style="color: {pageColor}">
		{#if slice.primary.heading}
				<PrismicRichText field={slice.primary.heading} />
		{/if}
		{#if slice.primary.description}
				<PrismicRichText field={slice.primary.description} /><br />
		{/if}
		{#each slice.primary.accordion_items as item, index}
			<div class="border-b pb-4" style="border-color: {pageColor}">
				<button
					class="text-2xl font-semibold tracking-tight inline-flex items-center justify-between w-full"
					aria-haspopup="true"
					aria-expanded={openIndex === index}
					on:click={() => toggleItem(index)}
				>
				{item.label}
					<svg
						class="w-4 h-4 ml-1 fill-current transform transition-transform"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						class:rotate-180={openIndex === index}
					>
						<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
					</svg>
				</button>
				<div class={openIndex === index ? 'block mt-2' : 'hidden'}>
					<PrismicRichText field={item.content} />
				</div>
			</div>
		{/each}
	</div>
</Bounded>

<style>
	button {
		text-align: left;
	}
</style>
