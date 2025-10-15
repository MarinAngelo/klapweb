<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicText } from '@prismicio/svelte';

	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import Bounded from '$lib/components/Bounded.svelte';
	import ImageCard from './ImageCard.svelte';
	import Heading from '$lib/components/Heading.svelte';

	export let slice: Content.ImageCardsSlice;
	// Um Fehler zu vermeiden, Probs hinzufügen, die in der Slice-Definition erwartet werden
	export const slices: any = {}; // Initialize with an empty object and provide a type
	export const context: any = {}; // Initialize with an empty object and provide a type
	export const index: number = 0; // Initialize with a default value and specify the type
</script>

<Bounded
	tag="section"
	specialLayout={true}
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class="grid gap-12" style="color: {get(theme).pageColor}">
		{#if isFilled.richText(slice.primary.heading)}
			<Heading class="text-center">
				<PrismicText field={slice.primary.heading} />
			</Heading>
		{/if}
		<ul class="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
			{#each slice.primary.cards as card}
				<ImageCard
					{card}
					bodyBgColor={slice.primary.body_bg_color}
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
