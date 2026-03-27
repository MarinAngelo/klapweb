<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import Bounded from '$lib/components/Bounded.svelte';
	import { convertNumber } from '$lib/utils/convertNumber';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: any;

	const p = slice.primary ?? {};

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = p.mobile_vollbreite ?? false;

	const mapOpacity = convertNumber(p.opacity ?? 100);
	const mapHeight = p.map_height || 400;

	let embedUrl = '';

	onMount(async () => {
		const raw = p.map_url?.trim();
		if (!raw) return;

		// Direkte Embed-URL → sofort verwenden, kein API-Aufruf nötig
		if (raw.includes('google.com/maps/embed') || raw.includes('output=embed')) {
			embedUrl = raw;
			return;
		}

		// Kurzlink oder normale Maps-URL → über API auflösen
		try {
			const res = await fetch(`/api/maps-embed?url=${encodeURIComponent(raw)}`);
			if (res.ok) {
				const data = await res.json();
				embedUrl = data.embedUrl;
			}
		} catch {
			embedUrl = raw;
		}
	});
</script>

<Bounded
	tag="section"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class={mobileVollbreite ? 'overflow-x-clip' : ''}
>
	<div class="relative {mobileVollbreite ? '-mx-6 md:mx-0' : ''}">
		{#if embedUrl}
			<div class="relative rounded-3xl overflow-hidden">
				<iframe
					src={embedUrl}
					width="100%"
					height={mapHeight}
					style="border: 0; display: block; min-height: {mapHeight}px;"
					allowfullscreen={true}
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
					title="Google Maps"
				></iframe>
				{#if mapOpacity > 0}
					<div
						class="absolute inset-0"
						style="background-color: {$theme.pageBgColor}; opacity: {mapOpacity}; pointer-events: none;"
					></div>
				{/if}
			</div>
		{/if}
	</div>
</Bounded>
