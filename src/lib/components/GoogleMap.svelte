<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { whenShown } from '$lib/actions/whenShown';
	import { _ } from '$lib/stores/i18n';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import { resolveMapUrl, type MapProvider } from '$lib/utils/mapUrl';

	/** «Kartenpunkt»: link (OSM, Google, Apple, swisstopo) or coordinates — shown as OpenStreetMap */
	export let mapUrl: string | null | undefined = undefined;
	export let mapHeight: number = 400;
	/** 0–1, CSS-Overlay-Opacity über der Karte */
	export let mapOpacity: number = 0;
	/** true = rounded-3xl (standalone), false = keine Ecken (z.B. innerhalb einer Card) */
	export let roundCorners: boolean = true;
	export let mobileVollbreite: boolean = false;

	let embedUrl = '';
	let directionsUrl = '';
	let provider: MapProvider = 'openstreetmap';

	const mapTitle = 'OpenStreetMap';

	// The map inside the iframe (OSM: Leaflet) sets up its tiles once while loading:
	// - Chrome throttles cross-origin iframes while they are invisible (reveal animation starts
	//   at opacity 0) → tile fade-in stalls, most tiles stay invisible
	// - its size is measured only once
	// → load only when in view and no ancestor is transparent; reload OSM on a width change.
	let shown = false;
	let boxWidth = 0;
	let loadedWidth = 0;
	let resizeTimer: ReturnType<typeof setTimeout> | undefined;

	$: if (shown && boxWidth && Math.abs(boxWidth - loadedWidth) > 40) {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => (loadedWidth = boxWidth), loadedWidth ? 300 : 50);
	}
	$: reloadKey = provider === 'openstreetmap' ? loadedWidth : 0;

	onDestroy(() => clearTimeout(resizeTimer));

	onMount(async () => {
		const raw = mapUrl?.trim();
		if (!raw) return;
		({ provider, embedUrl, directionsUrl } = await resolveMapUrl(raw));
	});
</script>

{#if embedUrl}
	<div class="flex flex-col gap-3">
		<ConsentGate service={provider} minHeight={mapHeight}>
			<div
				bind:clientWidth={boxWidth}
				use:whenShown={() => (shown = true)}
				style:min-height="{mapHeight}px"
				class="relative overflow-hidden {!roundCorners
					? ''
					: mobileVollbreite
						? '-mx-6 md:mx-0 md:rounded-3xl'
						: 'rounded-3xl'}"
			>
				{#if loadedWidth}
					{#key reloadKey}
						<iframe
							class="border-0 block"
							src={embedUrl}
							width="100%"
							height={mapHeight}
							style:min-height="{mapHeight}px"
							allowfullscreen={true}
							loading="lazy"
							referrerpolicy="no-referrer-when-downgrade"
							title={mapTitle}
						></iframe>
					{/key}
				{/if}
				{#if mapOpacity > 0}
					<div
						class="absolute inset-0 bg-page-bg pointer-events-none"
						style:opacity={mapOpacity}
					></div>
				{/if}
			</div>
		</ConsentGate>
		{#if directionsUrl}
			<a
				href={directionsUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 self-center md:self-start px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-70 text-page"
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
