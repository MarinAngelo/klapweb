<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/stores/i18n';

	export let mapUrl: string | null | undefined = undefined;
	export let mapHeight: number = 400;
	/** 0–1, CSS-Overlay-Opacity über der Karte */
	export let mapOpacity: number = 0;
	/** true = rounded-3xl (standalone), false = keine Ecken (z.B. innerhalb einer Card) */
	export let roundCorners: boolean = true;
	export let mobileVollbreite: boolean = false;

	let embedUrl = '';
	let resolvedUrl = '';

	$: directionsUrl = resolvedUrl ? toDirectionsUrl(resolvedUrl) : '';

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

	onMount(async () => {
		const raw = mapUrl?.trim();
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

{#if embedUrl}
	<div class="flex flex-col gap-3">
		<div
			class="relative overflow-hidden {!roundCorners
				? ''
				: mobileVollbreite
					? '-mx-6 md:mx-0 md:rounded-3xl'
					: 'rounded-3xl'}"
		>
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
				class="inline-flex items-center gap-2 self-center md:self-start px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-70"
				style="color: var(--page-color);"
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
