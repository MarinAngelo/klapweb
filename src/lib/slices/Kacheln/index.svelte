<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicText } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import ImageCard from './ImageCard.svelte';

	export let slice: Content.ImageCardsSlice;
	// Um Fehler zu vermeiden, Probs hinzufügen, die in der Slice-Definition erwartet werden
	export const slices: any = {}; // Initialize with an empty object and provide a type
	export const context: any = {}; // Initialize with an empty object and provide a type
	export const index: number = 0; // Initialize with a default value and specify the type

	const componentBodyBgColor = slice.primary.component_body_bg_color || get(theme).pageBgColor;
	const componentBodyColor = slice.primary.component_body_color || get(theme).pageColor;
	// Prüfe ob Hintergrundfarbe vom CMS kommt (nicht Fallback)
	const hasCustomBgColor = !!slice.primary.component_body_bg_color;
	// Grid-Spalten aus CMS (2 oder 3, Fallback: 2)
	const gridColumns = String(slice.primary.grid_columns).includes('3') ? 3 : 2;
</script>

<Bounded
	tag="section"
	specialLayout={true}
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class={hasCustomBgColor ? 'pb-16 md:pb-20' : ''}
	style="background-color: {componentBodyBgColor}; --custom-component-color: {componentBodyColor};"
>
	<div class="grid gap-12">
		{#if isFilled.richText(slice.primary.heading)}
			<h2 class="text-center custom-color">
				<PrismicText field={slice.primary.heading} />
			</h2>
		{/if}
		<ul
			class="grid grid-cols-1 items-start gap-8 {gridColumns === 3
				? 'md:grid-cols-3'
				: 'md:grid-cols-2'}"
		>
			{#each slice.primary.cards as card}
				<ImageCard
					{card}
					roundCorners={slice.primary.round_corners}
					bodyBgColor={slice.primary.body_bg_color}
					bodyColor={slice.primary.body_color}
					buttonColor={slice.primary.button_color}
					buttonBgColor={slice.primary.button_bg_color}
					buttonHoverColor={slice.primary.button_hover_color}
					buttonHoverBgColor={slice.primary.button_hover_bg_color}
					borderColor={slice.primary.border_color}
				/>
			{/each}
		</ul>
	</div>
</Bounded>

<style>
	.custom-color {
		color: var(--custom-component-color) !important;
	}
</style>
