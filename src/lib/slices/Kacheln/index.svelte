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
	export let slices; // Diese Zeile hinzufügen
	export let context; // Diese Zeile hinzufügen
	export let index; // Diese Zeile hinzufügen
</script>

<Bounded tag="section" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<div class="grid gap-12" style="color: {get(theme).pageColor}">
		{#if isFilled.richText(slice.primary.heading)}
			<Heading class="text-center">
				<PrismicText field={slice.primary.heading} />
			</Heading>
		{/if}
		<ul class="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
			{#each slice.primary.cards as card}
				<ImageCard {card} />
			{/each}
		</ul>
	</div>
</Bounded>
