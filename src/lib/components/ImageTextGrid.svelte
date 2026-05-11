<script lang="ts">
	// 1. PrismicImage holen wir weiter aus der Library (da hast du keinen Wrapper)
	import { PrismicImage } from '@prismicio/svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import BildLupe from '$lib/components/BildLupe.svelte';
	import BildSlider from '$lib/components/BildSlider.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import { isFilled } from '@prismicio/client';
	export let image: any;
	export let images: any[] | undefined = undefined;
	$: activeImages = images?.filter(img => isFilled.image(img)) ?? [];
	export let text: any;
	export let imageLeft: boolean = false;
	export let imageBgColor: string = '';
	export let imageRound: boolean = false;
	export let overlayColor: string = '';
	export let overlayTransparency: number = 100;
	export let mobilePadding: string = '';
	export let mobilePaddingTop: string = '';
	export let desktopPadding: string = '';
	export let desktopPaddingY: string = '';
	export let noRoundMobile: boolean = false;
	export let noRound: boolean = false;
	export let mobileTextFirst: boolean = false;
	export let columnGap: 'kein' | 'klein' | 'mittel' | 'gross' = 'mittel';

	const gapClass: Record<string, string> = {
		kein: 'gap-0',
		klein: 'gap-4',
		mittel: 'gap-8',
		gross: 'gap-16'
	};
	export let noObjectCover: boolean = false;
	export let lupe: boolean = false;
	export let lightbox: boolean = false;
	export let textCenterV: boolean = false;
	export let textCenterH: boolean = false;
	export let fullscreen: boolean = false;

	$: overlayOpacity = 1 - overlayTransparency / 100;
</script>

<div id="5" class="grid grid-cols-1 items-stretch {gapClass[columnGap] ?? 'gap-8'} md:grid-cols-2 {fullscreen ? 'md:h-full' : ''}">
	{#if imageLeft}
		<!-- Bild links, Text rechts -->
		<div
			id="6"
			class="{mobileTextFirst ? 'order-2 md:order-none' : ''} md:h-full {imageRound ? 'md:rounded-full' : noRound ? '' : 'md:rounded-3xl'} overflow-hidden"
			style={imageBgColor ? `background-color: ${imageBgColor};` : ''}
		>
			{#if activeImages.length > 1}
				<BildSlider images={activeImages} {imageRound} {noRound} {noRoundMobile} {noObjectCover} />
			{:else if image}
				<div id="7" class="relative md:h-full" style="background-color: {imageBgColor};">
					{#if lupe}
						<BildLupe imageUrl={image?.url ?? ''}>
							<PrismicImage
								field={image}
								sizes="100vw"
								class="w-full {noObjectCover ? '' : 'md:h-full md:object-cover'} {imageRound ? 'rounded-full' : noRound ? '' : noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl'}"
							/>
						</BildLupe>
					{:else if lightbox}
						<Lightbox src={image.url ?? ''} alt={image.alt ?? ''}>
							<PrismicImage
								field={image}
								sizes="100vw"
								class="w-full {noObjectCover ? '' : 'md:h-full md:object-cover'} {imageRound ? 'rounded-full' : noRound ? '' : noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl'}"
							/>
						</Lightbox>
					{:else}
						<PrismicImage
							field={image}
							sizes="100vw"
							class="w-full {noObjectCover ? '' : 'md:h-full md:object-cover'} {imageRound
								? 'rounded-full'
								: noRound
									? ''
									: noRoundMobile
										? 'md:rounded-3xl'
										: 'rounded-3xl'}"
						/>
					{/if}
					{#if overlayColor && overlayOpacity > 0}
						<div
							class="absolute inset-0 {imageRound
								? 'rounded-full'
								: noRound
									? ''
									: noRoundMobile
										? 'md:rounded-3xl'
										: 'rounded-3xl'}"
							style="background-color: {overlayColor}; opacity: {overlayOpacity}; pointer-events: none;"
						></div>
					{/if}
				</div>
			{/if}
		</div>
		<div
			id="8"
			class="{mobileTextFirst ? 'order-1 md:order-none' : ''} text-col flex flex-col {textCenterV ? 'justify-center' : ''} {textCenterH
				? 'text-center'
				: ''}"
			style="--mob-pad: {mobilePadding}; --mob-pad-top: {mobilePaddingTop}; --desk-pad: {desktopPadding}; --desk-pad-y: {desktopPaddingY};"
		>
			<PrismicRichText field={text} />
			{#if $$slots.default}
				<div class="mt-auto pt-4"><slot /></div>
			{/if}
		</div>
	{:else}
		<!-- Text links, Bild rechts -->
		<div
			id="6"
			class="text-col flex flex-col {textCenterV ? 'justify-center' : ''} {textCenterH
				? 'text-center'
				: ''}"
			style="--mob-pad: {mobilePadding}; --mob-pad-top: {mobilePaddingTop}; --desk-pad: {desktopPadding}; --desk-pad-y: {desktopPaddingY};"
		>
			<PrismicRichText field={text} />
			{#if $$slots.default}
				<div class="mt-auto pt-4"><slot /></div>
			{/if}
		</div>
		<div
			id="7"
			class="md:h-full {imageRound ? 'md:rounded-full' : noRound ? '' : 'md:rounded-3xl'} overflow-hidden"
			style="padding-bottom: 0; {imageBgColor ? `background-color: ${imageBgColor};` : ''}"
		>
			{#if activeImages.length > 1}
				<BildSlider images={activeImages} {imageRound} {noRound} {noRoundMobile} {noObjectCover} />
			{:else if image}
				<div id="8" class="relative md:h-full" style="background-color: {imageBgColor};">
					{#if lupe}
						<BildLupe imageUrl={image?.url ?? ''}>
							<PrismicImage
								field={image}
								sizes="100vw"
								class="w-full {noObjectCover ? '' : 'md:h-full md:object-cover'} {imageRound ? 'rounded-full' : noRound ? '' : noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl'}"
							/>
						</BildLupe>
					{:else if lightbox}
						<Lightbox src={image.url ?? ''} alt={image.alt ?? ''}>
							<PrismicImage
								field={image}
								sizes="100vw"
								class="w-full {noObjectCover ? '' : 'md:h-full md:object-cover'} {imageRound ? 'rounded-full' : noRound ? '' : noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl'}"
							/>
						</Lightbox>
					{:else}
						<PrismicImage
							field={image}
							sizes="100vw"
							class="w-full {noObjectCover ? '' : 'md:h-full md:object-cover'} {imageRound
								? 'rounded-full'
								: noRound
									? ''
									: noRoundMobile
										? 'md:rounded-3xl'
										: 'rounded-3xl'}"
						/>
					{/if}
					{#if overlayColor && overlayOpacity > 0}
						<div
							class="absolute inset-0 {imageRound
								? 'rounded-full'
								: noRound
									? ''
									: noRoundMobile
										? 'md:rounded-3xl'
										: 'rounded-3xl'}"
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
			padding-bottom: var(--mob-pad-top, var(--mob-pad, 0));
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
