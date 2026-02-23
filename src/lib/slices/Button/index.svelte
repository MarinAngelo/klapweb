<script lang="ts">
	import { isFilled } from '@prismicio/client';
	import { PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';

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

	$: sizeClass = sizeMap[slice.primary.button_size] ?? sizeMap['Mittel'];
	$: alignClass = alignMap[slice.primary.button_align] ?? alignMap['Mitte'];
	$: mobileFullWidth = slice.primary.mobile_full_width ?? false;

	$: buttonColor = slice.primary.button_color || get(theme).pageButtonColor;
	$: buttonBgColor = slice.primary.button_bg_color || get(theme).pageButtonBgColor;
	$: buttonHoverColor = slice.primary.button_hover_color || get(theme).pageButtonHoverColor;
	$: buttonHoverBgColor = slice.primary.button_hover_bg_color || get(theme).pageButtonHoverBgColor;
</script>

<Bounded
	tag="section"
	yPadding="sm"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class={alignClass}>
		{#if isFilled.link(slice.primary.button_link)}
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
</Bounded>
