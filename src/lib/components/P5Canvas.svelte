<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type p5Type from 'p5';

	/**
	 * Sketch factory — receives the p5 instance and the container element.
	 * Define p.setup, p.draw, etc. inside.
	 *
	 * Example:
	 *   sketch={(p, el) => {
	 *     p.setup = () => p.createCanvas(el.offsetWidth, el.offsetHeight);
	 *     p.draw  = () => { p.background(220); p.circle(p.mouseX, p.mouseY, 40); };
	 *   }}
	 */
	export let sketch: (p: p5Type, container: HTMLDivElement) => void;

	/** CSS width of the container (default: 100%) */
	export let width: string = '100%';

	/** CSS height of the container (default: 400px) */
	export let height: string = '400px';

	let container: HTMLDivElement;
	let instance: p5Type | null = null;
	let ro: ResizeObserver | null = null;

	onMount(async () => {
		const p5 = (await import('p5')).default;

		// Wait for the next animation frame: by then all Svelte reactive updates
		// (e.g. $bannerHeight derived from $headerHeight measured by Header onMount)
		// have been applied to the DOM and the browser has calculated final layout,
		// so container.offsetHeight returns the correct value for createCanvas().
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

		if (!container) return;

		// Instance mode: canvas is appended into `container`
		instance = new p5((p: p5Type) => sketch(p, container), container) as p5Type;

		// Responsive: resize canvas when container changes size
		ro = new ResizeObserver(() => {
			if (instance && container) {
				(instance as p5Type & { resizeCanvas(w: number, h: number): void }).resizeCanvas(
					container.offsetWidth,
					container.offsetHeight
				);
			}
		});
		ro.observe(container);
	});

	onDestroy(() => {
		ro?.disconnect();
		instance?.remove();
		instance = null;
	});
</script>

<div bind:this={container} style="width: {width}; height: {height}; overflow: hidden; display: block;"></div>
