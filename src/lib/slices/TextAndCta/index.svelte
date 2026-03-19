<script lang="ts">
	import { isFilled } from '@prismicio/client';
	import { PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { getBeauftragunHref } from '$lib/utils/beauftragungHref';

	export let slice: any;
	export let slices: any;
	export let context: any;
	export let index: any;

	const sizeMap: Record<string, string> = {
		Klein: 'px-3 py-1.5 text-sm',
		Mittel: 'px-6 py-3 text-base',
		Gross: 'px-10 py-4 text-lg'
	};

	const alignMap: Record<string, string> = {
		Links: 'flex justify-start',
		Mitte: 'flex justify-center',
		Rechts: 'flex justify-end'
	};

	const textAlignMap: Record<string, string> = {
		Links: 'text-left',
		Mitte: 'text-center',
		Rechts: 'text-right'
	};

	$: sizeClass = sizeMap[slice.primary.button_size] ?? sizeMap['Mittel'];
	$: alignClass = alignMap[slice.primary.button_align] ?? alignMap['Mitte'];
	$: mobileFullWidth = slice.primary.mobile_full_width ?? false;
	$: fullscreenHeight = slice.primary.fullscreen_height ?? false;
	$: scrollSnap = slice.primary.scroll_snap ?? false;
	$: textAlignClass = textAlignMap[slice.primary.text_align] ?? textAlignMap['Links'];

	$: bgColor = slice.primary.bg_color || null;
	$: textColor = slice.primary.text_color || null;
	$: textZoomDesktop = ((slice.primary.text_zoom_desktop ?? 100) / 100);
	$: textZoomMobile = ((slice.primary.text_zoom_mobile ?? 100) / 100);

	$: buttonColor = slice.primary.button_color || textColor || get(theme).pageButtonColor;
	$: buttonBgColor = slice.primary.button_bg_color || get(theme).pageButtonBgColor;
	$: buttonHoverColor = slice.primary.button_hover_color || bgColor || get(theme).pageButtonHoverColor;
	$: buttonHoverBgColor = slice.primary.button_hover_bg_color || textColor || get(theme).pageButtonHoverBgColor;
	$: beauftragungHref = getBeauftragunHref(slice.primary.button_link, $page.params.uid);

	// Scroll-Snap: scroll-snap-type auf html setzen wenn aktiviert
	onMount(() => {
		if (scrollSnap) {
			document.documentElement.style.scrollSnapType = 'y proximity';
		}
		return () => {
			document.documentElement.style.scrollSnapType = '';
		};
	});
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	style="
		{bgColor ? `background-color: ${bgColor};` : ''}
		{textColor ? `color: ${textColor}; --page-color: ${textColor};` : ''}
		{fullscreenHeight ? 'min-height: 100vh;' : ''}
		{scrollSnap ? 'scroll-snap-align: start;' : ''}
	"
	class="flex flex-col justify-center"
>
	<Bounded tag="div" yPadding="base" class="!pt-12 md:!pt-28">
		<div
			class="text-and-cta-content space-y-14 {textAlignClass}"
			style="--text-zoom-desktop: {textZoomDesktop}; --text-zoom-mobile: {textZoomMobile};"
		>
			{#if 'text' in slice.primary}
				<PrismicRichText field={slice.primary.text} />
			{/if}

			{#if isFilled.link(slice.primary.button_link)}
				<div class={alignClass}>
					{#if beauftragungHref}
						<a
							href={beauftragungHref}
							class="button-prismic-link font-semibold rounded-full border transition duration-200 ease-in-out {sizeClass} {mobileFullWidth
								? 'block w-full text-center sm:inline-block sm:w-auto'
								: 'inline-block'}"
							style="
								background-color: {buttonBgColor};
								color: {buttonColor};
								border-color: {buttonColor};
								--hover-text-color: {buttonHoverColor};
								--hover-bg-color: {buttonHoverBgColor};
								--focus-ring-color: {buttonColor};
							"
						>
							{slice.primary.button_text || 'Mehr erfahren'}
						</a>
					{:else}
						<PrismicLink
							field={slice.primary.button_link}
							class="button-prismic-link font-semibold rounded-full border transition duration-200 ease-in-out {sizeClass} {mobileFullWidth
								? 'block w-full text-center sm:inline-block sm:w-auto'
								: 'inline-block'}"
							style="
								background-color: {buttonBgColor};
								color: {buttonColor};
								border-color: {buttonColor};
								--hover-text-color: {buttonHoverColor};
								--hover-bg-color: {buttonHoverBgColor};
								--focus-ring-color: {buttonColor};
							"
						>
							{slice.primary.button_text || 'Mehr erfahren'}
						</PrismicLink>
					{/if}
				</div>
			{/if}
		</div>
	</Bounded>
</section>

<style>
	:global(.text-and-cta-content) {
		zoom: var(--text-zoom-desktop, 1);
	}
	@media (max-width: 640px) {
		:global(.text-and-cta-content) {
			zoom: var(--text-zoom-mobile, 1);
		}
	}
</style>
