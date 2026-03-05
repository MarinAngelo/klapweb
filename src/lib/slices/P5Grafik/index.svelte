<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import P5Canvas from '$lib/components/P5Canvas.svelte';
	import { mapAnimation } from '$lib/utils/animationMapper';
	import type p5Type from 'p5';

	export let slice: any;
	export let slices: any = {};
	export let context: any = {};
	export let index: number = 0;

	const bgColor = slice.primary.hintergrundfarbe || get(theme).pageBgColor;
	const heightPx: number = slice.primary.hoehe || 500;

	$: anim = mapAnimation(
		slice.primary.animate,
		slice.primary.anim_direction,
		slice.primary.anim_delay,
		slice.primary.anim_duration
	);

	// ---------------------------------------------------------------------------
	// Sketch definieren — hier den p5-Code eintragen
	// p  = p5-Instanz
	// el = Container-Element (für Dimensionen)
	// ---------------------------------------------------------------------------
	function sketch(p: p5Type, el: HTMLDivElement) {
		p.setup = () => {
			p.createCanvas(el.offsetWidth, heightPx);
			p.colorMode(p.HSB, 360, 100, 100, 100);
			p.noStroke();
		};

		p.draw = () => {
			p.background(0, 0, 10, 15); // leichtes Nachleuchten

			const t = p.frameCount * 0.02;
			for (let i = 0; i < 5; i++) {
				const x = p.width / 2 + p.cos(t + (i * p.TWO_PI) / 5) * (p.width * 0.3);
				const y = p.height / 2 + p.sin(t * 0.7 + (i * p.TWO_PI) / 5) * (p.height * 0.3);
				p.fill((i * 60 + p.frameCount) % 360, 80, 100, 60);
				p.circle(x, y, 80 + p.sin(t + i) * 30);
			}
		};
	}
</script>

<Bounded
	as="section"
	yPadding="none"
	style="background-color: {bgColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
	<P5Canvas {sketch} width="100%" height="{heightPx}px" />
</Bounded>
