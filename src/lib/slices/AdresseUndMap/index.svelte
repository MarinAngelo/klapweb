<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import { getMapProvider, resolveMapUrl, type MapProvider } from '$lib/utils/mapUrl';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
	import { convertNumber } from '$lib/utils/convertNumber';
	import { _ } from '$lib/stores/i18n';

	export let slice: any;
	export let slices: any[] | undefined = undefined;
	export let context: unknown = undefined;
	export let index: number | undefined = undefined;

	const p = slice.primary ?? {};

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = p.mobile_full_width ?? false;
	$: mapLeft = p.map_left ?? false;
	$: mapHeight = p.map_height || 400;
	$: textCenterH = p.text_center_h ?? false;
	$: textZoomDesktop = (p.text_zoom_desktop ?? 100) / 100;
	$: textZoomMobile = (p.text_zoom_mobile ?? 100) / 100;
	$: textColor = p.color || $theme.pageColor;
	$: bgColor = p.bg_color || $theme.pageBgColor;
	const mapOpacity = convertNumber(p.opacity ?? 100);

	let embedUrl = '';
	let directionsUrl = '';
	let provider: MapProvider = 'google_maps';

	$: mapTitle = provider === 'openstreetmap' ? 'OpenStreetMap' : 'Google Maps';

	onMount(async () => {
		if (!p.map_url) return;
		provider = getMapProvider(p.map_url);
		// Google: sofort auf Client setzen, damit der iframe vor der Animation existiert
		// (OSM-Links sind keine einbettbaren URLs → erst nach Umwandlung setzen)
		if (provider === 'google_maps') embedUrl = p.map_url;
		const resolved = await resolveMapUrl(p.map_url);
		embedUrl = resolved.embedUrl || embedUrl;
		directionsUrl = resolved.directionsUrl;
	});
</script>

<Bounded
	as="section"
	yPadding="base"
	class="color-scope {mobileVollbreite ? 'overflow-x-clip' : ''}"
	style="--scope-color: {textColor}; --scope-bg: {bgColor}; --page-color: {textColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	<div
		class="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch {mobileVollbreite
			? '-mx-6 md:mx-0'
			: ''}"
	>
		{#if mapLeft}
			<!-- Karte links, Text rechts -->
			<div class="flex flex-col gap-3">
				<div class="relative md:h-full rounded-3xl overflow-hidden">
					{#if embedUrl}
						<ConsentGate service={provider} minHeight={mapHeight}>
							<iframe
								src={embedUrl}
								width="100%"
								height={mapHeight}
								class="block h-full border-0"
								style:min-height="{mapHeight}px"
								allowfullscreen={true}
								loading="lazy"
								referrerpolicy="no-referrer-when-downgrade"
								title={mapTitle}
							></iframe>
							{#if mapOpacity > 0}
								<div
									class="absolute inset-0 pointer-events-none"
									style:background-color={bgColor}
									style:opacity={mapOpacity}
								></div>
							{/if}
						</ConsentGate>
					{/if}
				</div>
				{#if directionsUrl}
					<a
						href={directionsUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 self-center md:self-start px-4 py-2 rounded-full border text-sm font-medium transition-opacity hover:opacity-70 scope-border-solid scope-text"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg
						>
						{$_('Route planen')}
					</a>
				{/if}
			</div>
			<div
				class="text-col flex flex-col justify-center {textCenterH ? 'text-center' : ''}"
				style:--text-zoom-desktop={textZoomDesktop}
				style:--text-zoom-mobile={textZoomMobile}
			>
				<PrismicRichText field={p.text} />
			</div>
		{:else}
			<!-- Text links, Karte rechts -->
			<div
				class="text-col flex flex-col justify-center {textCenterH ? 'text-center' : ''}"
				style:--text-zoom-desktop={textZoomDesktop}
				style:--text-zoom-mobile={textZoomMobile}
			>
				<PrismicRichText field={p.text} />
			</div>
			<div class="flex flex-col gap-3">
				<div class="relative md:h-full rounded-3xl overflow-hidden">
					{#if embedUrl}
						<ConsentGate service={provider} minHeight={mapHeight}>
							<iframe
								src={embedUrl}
								width="100%"
								height={mapHeight}
								class="block h-full border-0"
								style:min-height="{mapHeight}px"
								allowfullscreen={true}
								loading="lazy"
								referrerpolicy="no-referrer-when-downgrade"
								title={mapTitle}
							></iframe>
							{#if mapOpacity > 0}
								<div
									class="absolute inset-0 pointer-events-none"
									style:background-color={bgColor}
									style:opacity={mapOpacity}
								></div>
							{/if}
						</ConsentGate>
					{/if}
				</div>
				{#if directionsUrl}
					<a
						href={directionsUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 self-center md:self-start px-4 py-2 rounded-full border text-sm font-medium transition-opacity hover:opacity-70 scope-border-solid scope-text"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg
						>
						{$_('Route planen')}
					</a>
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
