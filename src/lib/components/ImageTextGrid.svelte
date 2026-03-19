<script lang="ts">
	// 1. PrismicImage holen wir weiter aus der Library (da hast du keinen Wrapper)
import { PrismicImage } from '@prismicio/svelte';

// 2. WICHTIG: PrismicRichText holen wir aus DEINER eigenen Datei
import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	export let image: any;
	export let text: any;
	export let imageLeft: boolean = false;
	export let imageBgColor: string = '';
	export let imageRound: boolean = false;
	export let theme: any;
	export let overlayColor: string = '';
	export let overlayTransparency: number = 100;
	export let mobilePadding: string = '';
	export let mobilePaddingTop: string = '';
	export let desktopPadding: string = '';
	export let desktopPaddingY: string = '';
	export let noRoundMobile: boolean = false;

	$: overlayOpacity = 1 - overlayTransparency / 100;
</script>

<div id="5" class="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2">
	{#if imageLeft}
		<!-- Bild links, Text rechts -->
		<div id="6" class="md:h-full {imageRound ? 'md:rounded-full' : 'md:rounded-3xl'} overflow-hidden" style="{imageBgColor ? `background-color: ${imageBgColor};` : ''}">
			{#if image}
				<div id="7" class="relative md:h-full" style="background-color: {imageBgColor};">
					<PrismicImage
						field={image}
						sizes="100vw"
						class="w-full md:h-full md:object-cover {imageRound ? 'rounded-full' : (noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl')}"
					/>
					{#if overlayColor && overlayOpacity > 0}
						<div
							class="absolute inset-0 {imageRound ? 'rounded-full' : (noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl')}"
							style="background-color: {overlayColor}; opacity: {overlayOpacity}; pointer-events: none;"
						></div>
					{/if}
				</div>
			{/if}
		</div>
		<div id="8" class="text-col" style="--mob-pad: {mobilePadding}; --mob-pad-top: {mobilePaddingTop}; --desk-pad: {desktopPadding}; --desk-pad-y: {desktopPaddingY};">
			<PrismicRichText field={text} />
		</div>
	{:else}
		<!-- Text links, Bild rechts -->
		<div id="6" class="text-col" style="--mob-pad: {mobilePadding}; --mob-pad-top: {mobilePaddingTop}; --desk-pad: {desktopPadding}; --desk-pad-y: {desktopPaddingY};">
			<PrismicRichText field={text} />
		</div>
		<div id="7" class="md:h-full {imageRound ? 'md:rounded-full' : 'md:rounded-3xl'} overflow-hidden" style="padding-bottom: 0; {imageBgColor ? `background-color: ${imageBgColor};` : ''}">
			{#if image}
				<div id="8" class="relative md:h-full" style="background-color: {imageBgColor};">
					<PrismicImage
						field={image}
						sizes="100vw"
						class="w-full md:h-full md:object-cover {imageRound ? 'rounded-full' : (noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl')}"
					/>
					{#if overlayColor && overlayOpacity > 0}
						<div
							class="absolute inset-0 {imageRound ? 'rounded-full' : (noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl')}"
							style="background-color: {overlayColor}; opacity: {overlayOpacity}; pointer-events: none;"
						></div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	@media (max-width: 767px) {
		.text-col {
			padding-left: var(--mob-pad, 0);
			padding-right: var(--mob-pad, 0);
			padding-top: var(--mob-pad-top, var(--mob-pad, 0));
		}
	}

	@media (min-width: 768px) {
		.text-col {
			padding-left: var(--desk-pad, 0);
			padding-right: var(--desk-pad, 0);
			padding-top: var(--desk-pad-y, 0);
			padding-bottom: var(--desk-pad-y, 0);
		}
	}
</style>
