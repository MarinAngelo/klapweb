<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import Bounded from '$lib/components/Bounded.svelte';
	import ImageTextGrid from '$lib/components/ImageTextGrid.svelte';

	export let slice: Content.TextWithImageSlice;
	console.log('TextMitBild slice:', slice.variation);

	// Um Fehler zu vermeiden, Probs hinzufügen, die in der Slice-Definition erwartet werden
	export let slices; // Diese Zeile hinzufügen
	export let context; // Diese Zeile hinzufügen
	export let index; // Diese Zeile hinzufügen

	// Setze den Standardwert von yPadding basierend auf y_padding_same
	let yPadding = slice.primary.y_padding_same ? 'base' : 'base-top';

	// Überschreibe den Standardwert von yPadding mit dem Wert aus der Slice-Definition
	if (slice.primary.y_padding) {
		switch (slice.primary.y_padding) {
			case 'kein Abstand':
				yPadding = 'none';
				break;
			case 'wenig':
				yPadding = slice.primary.y_padding_same ? 'sm' : 'sm-top';
				break;
			case 'mittel':
				yPadding = slice.primary.y_padding_same ? 'base' : 'base-top';
				break;
			case 'gross':
				yPadding = slice.primary.y_padding_same ? 'lg' : 'lg-top';
				break;
		}
	}

	const isBildLinks = slice.variation === 'standardBildLinks';
</script>

<Bounded
	as="section"
	{yPadding}
	style="background-color: {slice.primary.bg_color || get(theme).pageBgColor}; color: {slice.primary
		.color || get(theme).pageColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<ImageTextGrid
		image={isFilled.image(slice.primary.image) ? slice.primary.image : null}
		text={slice.primary.text}
		imageLeft={isBildLinks}
		imageBgColor={slice.primary.bg_color || get(theme).pageBgColor}
		imageRound={slice.primary.image_round}
		{theme}
	/>
</Bounded>
