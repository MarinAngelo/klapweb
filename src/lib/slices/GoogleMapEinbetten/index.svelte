<script lang="ts">
	import { onMount } from 'svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import { convertNumber } from '$lib/utils/convertNumber';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
	import { _ } from '$lib/stores/i18n';

	export let slice: any;

	const p = slice.primary ?? {};

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = p.mobile_full_width ?? false;

	const mapOpacity = convertNumber(p.opacity ?? 100);
	const mapHeight = p.map_height || 400;

	let embedUrl = '';
	let resolvedUrl = '';

	function toDirectionsUrl(resolved: string): string {
		if (!resolved) return '';
		const placeMatch = resolved.match(/\/maps\/place\/([^/@?]+)/);
		if (placeMatch) {
			const place = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
			return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`;
		}
		const coordMatch = resolved.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
		if (coordMatch) {
			return `https://www.google.com/maps/dir/?api=1&destination=${coordMatch[1]},${coordMatch[2]}`;
		}
		try {
			const q = new URL(resolved).searchParams.get('q');
			if (q) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
		} catch {}
		return '';
	}

	$: directionsUrl = resolvedUrl ? toDirectionsUrl(resolvedUrl) : '';

	onMount(async () => {
		const raw = p.map_url?.trim();
		if (!raw) return;

		if (raw.includes('google.com/maps/embed') || raw.includes('output=embed')) {
			embedUrl = raw;
			resolvedUrl = raw;
			return;
		}

		try {
			const res = await fetch(`/api/maps-embed?url=${encodeURIComponent(raw)}`);
			if (res.ok) {
				const data = await res.json();
				embedUrl = data.embedUrl;
				resolvedUrl = data.resolvedUrl || data.embedUrl;
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
			<div class="flex flex-col gap-3">
				<div class="relative overflow-hidden {mobileVollbreite ? 'md:rounded-3xl' : 'rounded-3xl'}">
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
							style="background-color: var(--page-bg-color); opacity: {mapOpacity}; pointer-events: none;"
						></div>
					{/if}
				</div>
				{#if directionsUrl}
					<a
						href={directionsUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 self-center md:self-start px-4 py-2 rounded-full border text-sm font-medium transition-opacity hover:opacity-70"
						style="border-color: var(--page-color); color: var(--page-color);"
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
