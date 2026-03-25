<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
	import { convertNumberInverse } from '$lib/utils/convertNumber';

	export let slice: any;
	export let slices: unknown[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	const p = slice.primary ?? {};

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = p.mobile_vollbreite ?? false;
	$: mapLeft = p.map_left ?? false;
	$: mapHeight = p.map_height || 400;
	$: textCenterH = p.text_center_h ?? false;
	$: textZoomDesktop = (p.text_zoom_desktop ?? 100) / 100;
	$: textZoomMobile = (p.text_zoom_mobile ?? 100) / 100;
	$: textColor = p.color || $theme.pageColor;
	$: bgColor = p.bg_color || $theme.pageBgColor;
	const mapOpacity = convertNumberInverse(p.opacity ?? 0) || 0;

	let embedUrl = '';

	onMount(async () => {
		if (!p.map_url) return;
		try {
			const res = await fetch(`/api/maps-embed?url=${encodeURIComponent(p.map_url)}`);
			if (res.ok) {
				const data = await res.json();
				embedUrl = data.embedUrl;
			}
		} catch {
			embedUrl = p.map_url;
		}
	});
</script>

<Bounded
	as="section"
	yPadding="base"
	style="background-color: {bgColor}; color: {textColor}; --page-color: {textColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class={mobileVollbreite ? 'overflow-x-clip' : ''}
>
	<div
		class="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch {mobileVollbreite
			? '-mx-6 md:mx-0 px-6 md:px-0'
			: ''}"
	>
		{#if mapLeft}
			<!-- Karte links, Text rechts -->
			<div class="relative md:h-full rounded-3xl overflow-hidden">
				{#if embedUrl}
					<iframe
						src={embedUrl}
						width="100%"
						height={mapHeight}
						style="border: 0; display: block; min-height: {mapHeight}px; height: 100%;"
						allowfullscreen={true}
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
						title="Google Maps"
					></iframe>
					{#if mapOpacity > 0}
						<div
							class="absolute inset-0"
							style="background-color: {bgColor}; opacity: {mapOpacity}; pointer-events: none;"
						></div>
					{/if}
				{/if}
			</div>
			<div
				class="text-col flex flex-col justify-center {textCenterH ? 'text-center' : ''}"
				style="--text-zoom-desktop: {textZoomDesktop}; --text-zoom-mobile: {textZoomMobile};"
			>
				<PrismicRichText field={p.text} />
			</div>
		{:else}
			<!-- Text links, Karte rechts -->
			<div
				class="text-col flex flex-col justify-center {textCenterH ? 'text-center' : ''}"
				style="--text-zoom-desktop: {textZoomDesktop}; --text-zoom-mobile: {textZoomMobile};"
			>
				<PrismicRichText field={p.text} />
			</div>
			<div class="relative md:h-full rounded-3xl overflow-hidden">
				{#if embedUrl}
					<iframe
						src={embedUrl}
						width="100%"
						height={mapHeight}
						style="border: 0; display: block; min-height: {mapHeight}px; height: 100%;"
						allowfullscreen={true}
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
						title="Google Maps"
					></iframe>
					{#if mapOpacity > 0}
						<div
							class="absolute inset-0"
							style="background-color: {bgColor}; opacity: {mapOpacity}; pointer-events: none;"
						></div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</Bounded>

<style>
	.text-col {
		zoom: var(--text-zoom-desktop, 1);
	}
	@media (max-width: 767px) {
		.text-col {
			zoom: var(--text-zoom-mobile, 1);
		}
	}
</style>
