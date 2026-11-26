<script lang="ts">
	/**
	 * Fullscreen image viewer for touch devices (replaces the desktop magnifier «Bild-Lupe»):
	 * pinch to zoom, double-tap to zoom in/out, drag to pan, tap outside / × / Escape to close.
	 */
	import { onMount, tick } from 'svelte';
	import { _ } from '$lib/stores/i18n';
	import { isLightboxOpen } from '$lib/stores/isLightboxOpen';

	export let src: string;
	export let alt = '';
	export let onClose: () => void;

	const MAX_SCALE = 5;
	const DOUBLE_TAP_SCALE = 2.5;

	let dialog: HTMLDialogElement;
	let img: HTMLImageElement;
	let scale = 1;
	let tx = 0;
	let ty = 0;
	let animate = false;

	// Gesture start values
	let startDist = 0;
	let startScale = 1;
	let startTx = 0;
	let startTy = 0;
	let startX = 0;
	let startY = 0;
	let moved = false;
	let lastTap = 0;

	onMount(() => {
		tick().then(() => dialog?.showModal());
		document.body.style.overflow = 'hidden';
		isLightboxOpen.set(true);
		return () => {
			document.body.style.overflow = '';
			isLightboxOpen.set(false);
		};
	});

	const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

	/** Keep the zoomed image covering the screen (no empty edges while panning) */
	function limit() {
		const maxX = Math.max(0, (img.clientWidth * scale - window.innerWidth) / 2);
		const maxY = Math.max(0, (img.clientHeight * scale - window.innerHeight) / 2);
		tx = clamp(tx, -maxX, maxX);
		ty = clamp(ty, -maxY, maxY);
	}

	/** Zoom so that screen point (px, py) stays under the finger */
	function zoomAt(
		px: number,
		py: number,
		newScale: number,
		fromScale: number,
		fromTx: number,
		fromTy: number
	) {
		const cx = window.innerWidth / 2;
		const cy = window.innerHeight / 2;
		const qx = (px - cx - fromTx) / fromScale;
		const qy = (py - cy - fromTy) / fromScale;
		scale = newScale;
		tx = px - cx - newScale * qx;
		ty = py - cy - newScale * qy;
		limit();
	}

	const dist = (t: TouchList) =>
		Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

	function onTouchStart(e: TouchEvent) {
		animate = false;
		startScale = scale;
		startTx = tx;
		startTy = ty;
		if (e.touches.length === 2) {
			startDist = dist(e.touches);
			startX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
			startY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
		} else if (e.touches.length === 1) {
			startX = e.touches[0].clientX;
			startY = e.touches[0].clientY;
			moved = false;
		}
	}

	function onTouchMove(e: TouchEvent) {
		e.preventDefault();
		if (e.touches.length === 2 && startDist) {
			const newScale = clamp((startScale * dist(e.touches)) / startDist, 1, MAX_SCALE);
			zoomAt(startX, startY, newScale, startScale, startTx, startTy);
			moved = true;
		} else if (e.touches.length === 1) {
			const dx = e.touches[0].clientX - startX;
			const dy = e.touches[0].clientY - startY;
			if (Math.hypot(dx, dy) > 8) moved = true;
			if (scale > 1) {
				tx = startTx + dx;
				ty = startTy + dy;
				limit();
			}
		}
	}

	function onTouchEnd(e: TouchEvent) {
		if (e.touches.length === 1) {
			// Second finger lifted: continue panning from here
			startTx = tx;
			startTy = ty;
			startX = e.touches[0].clientX;
			startY = e.touches[0].clientY;
			return;
		}
		if (e.touches.length > 0) return;
		startDist = 0;
		if (scale < 1.05) reset();
		if (moved) return;

		const touch = e.changedTouches[0];
		const now = Date.now();
		if (now - lastTap < 300) {
			// Double tap: zoom in at the tapped point, or back to full view
			lastTap = 0;
			animate = true;
			if (scale > 1) reset();
			else zoomAt(touch.clientX, touch.clientY, DOUBLE_TAP_SCALE, 1, 0, 0);
			return;
		}
		lastTap = now;
		// Single tap next to the image (not zoomed) closes
		const tappedImage = e.target === img;
		if (!tappedImage && scale === 1) setTimeout(() => lastTap && close(), 300);
	}

	function reset() {
		scale = 1;
		tx = 0;
		ty = 0;
	}

	function close() {
		dialog?.close();
		onClose();
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	class="zoom-viewer"
	aria-label={alt || $_('Bild')}
	on:cancel|preventDefault={close}
	on:touchstart={onTouchStart}
	on:touchmove|nonpassive={onTouchMove}
	on:touchend={onTouchEnd}
>
	<img
		bind:this={img}
		{src}
		{alt}
		class="zoom-img"
		class:animate
		style:transform="translate({tx}px, {ty}px) scale({scale})"
		draggable="false"
	/>
	<button type="button" class="zoom-close" on:click={close} aria-label={$_('Schliessen')}>×</button>
	{#if scale === 1}
		<p class="zoom-hint">{$_('Mit zwei Fingern oder Doppeltipp zoomen')}</p>
	{/if}
</dialog>

<style>
	.zoom-viewer {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100dvh;
		max-width: 100vw;
		max-height: 100dvh;
		margin: 0;
		padding: 0;
		border: none;
		background: rgba(0, 0, 0, 0.95);
		overflow: hidden;
		touch-action: none;
	}
	.zoom-viewer[open] {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.zoom-viewer::backdrop {
		background: rgba(0, 0, 0, 0.95);
	}
	.zoom-img {
		max-width: 100vw;
		max-height: 100dvh;
		object-fit: contain;
		transform-origin: center center;
		user-select: none;
		-webkit-user-select: none;
		will-change: transform;
	}
	.zoom-img.animate {
		transition: transform 0.25s ease;
	}
	.zoom-close {
		position: fixed;
		top: 0.75rem;
		right: 1rem;
		color: #fff;
		font-size: 2.5rem;
		line-height: 1;
		background: none;
		border: none;
		cursor: pointer;
		opacity: 0.8;
	}
	.zoom-hint {
		position: fixed;
		bottom: 1.25rem;
		left: 0;
		right: 0;
		margin: 0;
		text-align: center;
		color: rgba(255, 255, 255, 0.75);
		font-size: 0.875rem;
		pointer-events: none;
	}
</style>
