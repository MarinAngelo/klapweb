<script lang="ts">
	/**
	 * «Bild-Lupe»: magnifying lens following the mouse (devices with hover).
	 * Touch devices (no hover) get a tap-to-open fullscreen viewer with pinch zoom instead.
	 */
	import { onMount } from 'svelte';
	import { _ } from '$lib/stores/i18n';
	import ZoomViewer from '$lib/components/ZoomViewer.svelte';

	export let imageUrl: string;
	export let alt: string = '';
	export let zoomFactor: number = 2.5;
	export let lupeSize: number = 250;

	let containerEl: HTMLElement;
	let x = 0;
	let y = 0;
	let active = false;
	let containerW = 0;
	let containerH = 0;
	let isTouch = false;
	let viewerOpen = false;

	onMount(() => {
		const query = window.matchMedia('(hover: none)');
		isTouch = query.matches;
		const onChange = (e: MediaQueryListEvent) => (isTouch = e.matches);
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	});

	function onMove(e: MouseEvent) {
		if (isTouch) return;
		const rect = containerEl.getBoundingClientRect();
		x = e.clientX - rect.left;
		y = e.clientY - rect.top;
		containerW = rect.width;
		containerH = rect.height;
	}

	// Touch: open the zoom viewer; stop the click so a surrounding Lightbox does not open too
	function onClick(e: MouseEvent) {
		if (!isTouch || !imageUrl) return;
		e.stopPropagation();
		viewerOpen = true;
	}

	$: bgX = -(x * zoomFactor - lupeSize / 2);
	$: bgY = -(y * zoomFactor - lupeSize / 2);
	$: lupeStyle = [
		`left: ${x}px`,
		`top: ${y}px`,
		`width: ${lupeSize}px`,
		`height: ${lupeSize}px`,
		`background-image: url(${imageUrl})`,
		`background-size: ${containerW * zoomFactor}px ${containerH * zoomFactor}px`,
		`background-position: ${bgX}px ${bgY}px`,
		`background-repeat: no-repeat`
	].join(';');
</script>

<!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
<div
	class="lupe-container"
	class:touch={isTouch}
	bind:this={containerEl}
	on:mousemove={onMove}
	on:mouseenter={() => (active = !isTouch)}
	on:mouseleave={() => (active = false)}
	on:click|capture={onClick}
>
	<slot />
	{#if active && !isTouch && imageUrl}
		<div class="lupe-lens" style={lupeStyle}></div>
	{/if}
	{#if isTouch && imageUrl}
		<span class="zoom-badge" aria-hidden="true">
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
			>
				<circle cx="11" cy="11" r="7" />
				<path d="M20 20l-3.5-3.5M11 8v6M8 11h6" />
			</svg>
		</span>
		<span class="sr-only">{$_('Bild vergrössern')}</span>
	{/if}
</div>

{#if viewerOpen}
	<ZoomViewer src={imageUrl} {alt} onClose={() => (viewerOpen = false)} />
{/if}

<style>
	.lupe-container {
		position: relative;
		cursor: crosshair;
		overflow: hidden;
	}
	.lupe-container.touch {
		cursor: zoom-in;
	}
	.lupe-lens {
		position: absolute;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.85);
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.15),
			0 4px 24px rgba(0, 0, 0, 0.25);
		pointer-events: none;
		transform: translate(-50%, -50%);
		z-index: 10;
		background-repeat: no-repeat;
	}
	/* Touch hint: the image can be opened and zoomed */
	.zoom-badge {
		position: absolute;
		right: 0.5rem;
		bottom: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		pointer-events: none;
	}
</style>
