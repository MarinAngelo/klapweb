<script lang="ts">
	import { isFilled } from '@prismicio/client';
	import { PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';
	import Bounded from '$lib/components/Bounded.svelte';
	import { getBeauftragunHref } from '$lib/utils/beauftragungHref';
	import { mapAnimation } from '$lib/utils/animationMapper';

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

	const yPaddingMap: Record<string, string> = {
		'kein Abstand': 'none',
		wenig: 'sm-top',
		mittel: 'base-top',
		gross: 'lg-top'
	};

	$: p = slice.primary ?? {};
	$: sizeClass = sizeMap[p.button_size] ?? sizeMap['Mittel'];
	$: alignClass = alignMap[p.button_align] ?? alignMap['Mitte'];
	$: mobileFullWidth = p.mobile_full_width ?? false;
	$: yPadding = (yPaddingMap[p.y_padding] ?? 'base-top') as
		| 'none'
		| 'sm-top'
		| 'base-top'
		| 'lg-top';

	$: buttonColor = p.button_color || get(theme).pageButtonColor;
	$: buttonBgColor = p.button_bg_color || get(theme).pageButtonBgColor;
	$: buttonHoverColor = p.button_hover_color || get(theme).pageButtonHoverColor;
	$: buttonHoverBgColor = p.button_hover_bg_color || get(theme).pageButtonHoverBgColor;
	$: beauftragungHref = getBeauftragunHref(p.button_link, $page.params.uid);
	$: anim = mapAnimation(p.animate, p.anim_direction, p.anim_delay, p.anim_duration);
</script>

<Bounded
	tag="section"
	{yPadding}
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class="{slice.primary.mobile_vollbreite ? 'overflow-x-clip' : ''}"
>
	<div class="{alignClass} {slice.primary.mobile_vollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}">
		{#if slice.variation === 'kauf'}
			<a
				href="/beauftragung{$page.params.uid ? `?dienstleistung=${encodeURIComponent($page.params.uid)}` : ''}"
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
				{p.button_text || 'Jetzt beauftragen'}
			</a>
		{:else if isFilled.link(p.button_link)}
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
					{p.button_text || 'Mehr erfahren'}
				</a>
			{:else}
				<PrismicLink
					field={p.button_link}
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
					{p.button_text || 'Mehr erfahren'}
				</PrismicLink>
			{/if}
		{/if}
	</div>
</Bounded>

