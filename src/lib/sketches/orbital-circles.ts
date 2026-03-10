import type p5Type from 'p5';
import type { SketchParams } from './index';

/**
 * Sketch: Orbital Circles
 * Five circles orbit in a Lissajous pattern with cycling HSB colors and a trail effect.
 * sketchParams is read on every draw() call — mutate it reactively from Svelte.
 */
export function orbitalCirclesSketch(
	sketchParams: SketchParams
): (p5: p5Type, el: HTMLDivElement) => void {
	return (p5, el) => {
		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
			p5.colorMode(p5.HSB, 360, 100, 100, 100);
			p5.noStroke();
		};

		p5.draw = () => {
			if (sketchParams.bgColor) {
				const c = p5.color(sketchParams.bgColor);
				p5.background(p5.hue(c), p5.saturation(c), p5.brightness(c), 15);
			} else {
				p5.background(0, 0, 10, 15);
			}

			const t = p5.frameCount * 0.02;
			for (let i = 0; i < 5; i++) {
				const x = p5.width / 2 + p5.cos(t + (i * p5.TWO_PI) / 5) * (p5.width * 0.45);
				const y = p5.height / 2 + p5.sin(t * 0.7 + (i * p5.TWO_PI) / 5) * (p5.height * 0.45);
				p5.fill((i * 60 + p5.frameCount) % 360, 80, 100, 60);
				p5.circle(x, y, 80 + p5.sin(t + i) * 30);
			}
		};
	};
}
