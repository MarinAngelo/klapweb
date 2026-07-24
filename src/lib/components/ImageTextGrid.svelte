<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import BildLupe from '$lib/components/BildLupe.svelte';
	import BildSlider from '$lib/components/BildSlider.svelte';
	import { isFilled } from '@prismicio/client';

	export let image: any;
	export let images: any[] | undefined = undefined;
	$: activeImages = images?.filter((img) => isFilled.image(img)) ?? [];
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

	let dialog: HTMLDialogElement;

	function openLightbox() {
		if (!dialog) return;
		dialog.showModal();
		document.body.style.overflow = 'hidden';
	}

	function closeLightbox() {
		if (!dialog) return;
		dialog.close();
		document.body.style.overflow = '';
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === dialog) closeLightbox();
	}

	$: imgClass = `w-full ${noObjectCover ? '' : `${fullscreen ? 'md:h-full ' : ''}md:object-cover`} ${imageRound ? 'rounded-full' : noRound ? '' : noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl'}`;
</script>

<div
	class="grid grid-cols-1 items-stretch {gapClass[columnGap] ?? 'gap-8'} md:grid-cols-2 {fullscreen
		? 'md:h-full'
		: ''}"
>
	{#if imageLeft}
		<!-- Bild links, Text rechts -->
		<div
			class="{mobileTextFirst ? 'order-2 md:order-none' : ''} {fullscreen
				? 'md:h-full'
				: ''} {imageRound ? 'md:rounded-full' : noRound ? '' : 'md:rounded-3xl'} overflow-hidden"
			style={imageBgColor ? `background-color: ${imageBgColor};` : ''}
		>
			{#if activeImages.length > 1}
				<BildSlider
					images={activeImages}
					{imageRound}
					{noRound}
					{noRoundMobile}
					{noObjectCover}
					{lightbox}
				/>
			{:else if image}
				<div
					class="relative {fullscreen ? 'md:h-full' : ''}"
					style="background-color: {imageBgColor};"
				>
					{#if lupe}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							on:click={() => {
								if (window.innerWidth < 768) openLightbox();
							}}
						>
							<BildLupe imageUrl={image?.url ?? ''}>
								<PrismicImage field={image} sizes="100vw" class={imgClass} />
							</BildLupe>
						</div>
					{:else if lightbox}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div class="lightbox-trigger" on:click={openLightbox}>
							<PrismicImage field={image} sizes="100vw" class={imgClass} />
						</div>
					{:else}
						<PrismicImage field={image} sizes="100vw" class={imgClass} />
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
			class="{mobileTextFirst ? 'order-1 md:order-none' : ''} text-col flex flex-col {textCenterV
				? 'self-center'
				: ''} {textCenterH ? 'text-center' : ''}"
			style="--mob-pad: {mobilePadding}; --mob-pad-top: {mobilePaddingTop}; --desk-pad: {desktopPadding}; --desk-pad-y: {desktopPaddingY};"
		>
			<div class="text-content">
				<PrismicRichText field={text} />
			</div>
			{#if $$slots.default}
				<div class="mt-auto pt-0 md:pt-4"><slot /></div>
			{/if}
		</div>
	{:else}
		<!-- Text links, Bild rechts -->
		<div
			class="text-col flex flex-col {textCenterV ? 'self-center' : ''} {textCenterH
				? 'text-center'
				: ''} {mobileTextFirst ? '' : 'order-last md:order-none'}"
			style="--mob-pad: {mobilePadding}; --mob-pad-top: {mobilePaddingTop}; --desk-pad: {desktopPadding}; --desk-pad-y: {desktopPaddingY};"
		>
			<div class="text-content">
				<PrismicRichText field={text} />
			</div>
			{#if $$slots.default}
				<div class="mt-auto pt-0 md:pt-4"><slot /></div>
			{/if}
		</div>
		<div
			class="{mobileTextFirst ? '' : 'order-first md:order-none'} {fullscreen
				? 'md:h-full'
				: ''} {imageRound ? 'md:rounded-full' : noRound ? '' : 'md:rounded-3xl'} overflow-hidden"
			style="padding-bottom: 0; {imageBgColor ? `background-color: ${imageBgColor};` : ''}"
		>
			{#if activeImages.length > 1}
				<BildSlider
					images={activeImages}
					{imageRound}
					{noRound}
					{noRoundMobile}
					{noObjectCover}
					{lightbox}
				/>
			{:else if image}
				<div
					class="relative {fullscreen ? 'md:h-full' : ''}"
					style="background-color: {imageBgColor};"
				>
					{#if lupe}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							on:click={() => {
								if (window.innerWidth < 768) openLightbox();
							}}
						>
							<BildLupe imageUrl={image?.url ?? ''}>
								<PrismicImage field={image} sizes="100vw" class={imgClass} />
							</BildLupe>
						</div>
					{:else if lightbox}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div class="lightbox-trigger" on:click={openLightbox}>
							<PrismicImage field={image} sizes="100vw" class={imgClass} />
						</div>
					{:else}
						<PrismicImage field={image} sizes="100vw" class={imgClass} />
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

{#if (lightbox || lupe) && image}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<dialog bind:this={dialog} on:click={onBackdropClick} on:cancel={closeLightbox}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="lb-content" on:click|stopPropagation>
			<img src={image?.url ?? ''} alt={image?.alt ?? ''} class="lb-img" />
		</div>
		<button type="button" class="lb-close" on:click={closeLightbox} aria-label="Schliessen"
			>×</button
		>
	</dialog>
{/if}

<style>
	.lightbox-trigger {
		cursor: zoom-in;
		display: contents;
	}

	dialog {
		padding: 0;
		border: none;
		background: transparent;
		max-width: 100vw;
		max-height: 100vh;
		overflow: visible;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.92);
		animation: lb-in 0.2s ease;
	}

	.lb-img {
		max-width: min(90vw, 1600px);
		max-height: 90vh;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6);
		display: block;
		animation: lb-zoom 0.2s ease;
	}

	.lb-close {
		position: fixed;
		top: 1rem;
		right: 1.25rem;
		color: #fff;
		font-size: 2.5rem;
		line-height: 1;
		background: none;
		border: none;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.15s;
	}

	.lb-close:hover {
		opacity: 1;
	}

	@media (max-width: 767px) {
		.text-col {
			padding-left: var(--mob-pad, 0);
			padding-right: var(--mob-pad, 0);
			padding-top: var(--mob-pad-top, var(--mob-pad, 0));
			padding-bottom: 0;
		}

		.text-content p {
			margin-bottom: 0.5rem !important;
		}

		.text-content p:last-child {
			margin-bottom: 0 !important;
		}

		/* Wenn Text zuerst kommt (mobileTextFirst=true → order-1), brauchen wir Abstand zum Bild */
		.order-1 .text-content p:last-child {
			margin-bottom: 1.75rem !important;
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

	@keyframes lb-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes lb-zoom {
		from {
			transform: scale(0.92);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
