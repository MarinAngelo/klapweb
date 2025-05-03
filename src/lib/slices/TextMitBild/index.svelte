<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	export let slice: Content.TextWithImageSlice;

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
</script>

<Bounded
	as="section"
	{yPadding}
	style="background-color: {slice.primary.bg_color || get(theme).pageBgColor}; color: {slice.primary
		.color || get(theme).pageColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
		<div>
			<PrismicRichText field={slice.primary.text} />
		</div>
		<div>
			{#if isFilled.image(slice.primary.image)}
				<div style="background-color: {slice.primary.bg_color || get(theme).pageBgColor};">
					<PrismicImage field={slice.primary.image} sizes="100vw" class="w-full rounded-lg" />
				</div>
			{/if}
		</div>
	</div>
</Bounded>
