import type p5Type from 'p5';
import type { SketchParams } from './index';

const PARTICLE_COUNT = 280;
const SPEED = 1.8;
const NOISE_SCALE = 0.003;

/**
 * Sketch: Particle Flow
 * Particles drift along a Perlin noise vector field.
 * Suitable as a subtle, text-friendly full-screen hero background.
 */
export function particleFlowSketch(
	sketchParams: SketchParams
): (p5: p5Type, el: HTMLDivElement) => void {
	return (p5, el) => {
		type Particle = { x: number; y: number; alpha: number; size: number };
		let particles: Particle[] = [];

		function spawnParticle(): Particle {
			return {
				x: p5.random(p5.width),
				y: p5.random(p5.height),
				alpha: p5.random(20, 80),
				size: p5.random(1.5, 4)
			};
		}

		p5.setup = () => {
			p5.createCanvas(el.offsetWidth || window.innerWidth, window.innerHeight);
			p5.colorMode(p5.HSB, 360, 100, 100, 100);
			p5.noStroke();
			for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawnParticle());
		};

		p5.draw = () => {
			// Semi-transparent background for trail
			if (sketchParams.bgColor) {
				const c = p5.color(sketchParams.bgColor);
				p5.background(p5.hue(c), p5.saturation(c), p5.brightness(c), 25);
			} else {
				p5.background(0, 0, 8, 25);
			}

			// Derive particle hue from sketchParams.color if set, otherwise cycle slowly
			let baseHue: number | null = null;
			if (sketchParams.color) {
				const c = p5.color(sketchParams.color);
				baseHue = p5.hue(c);
			}

			const t = p5.frameCount * 0.004;

			for (const pt of particles) {
				// Perlin noise → angle in [0, 4π]
				const angle = p5.noise(pt.x * NOISE_SCALE, pt.y * NOISE_SCALE, t) * p5.TWO_PI * 2;
				pt.x += p5.cos(angle) * SPEED;
				pt.y += p5.sin(angle) * SPEED;

				// Wrap at edges
				if (pt.x < 0) pt.x = p5.width;
				if (pt.x > p5.width) pt.x = 0;
				if (pt.y < 0) pt.y = p5.height;
				if (pt.y > p5.height) pt.y = 0;

				const hue =
					baseHue !== null
						? (baseHue + p5.noise(pt.x * 0.001, pt.y * 0.001) * 40 - 20 + 360) % 360
						: (p5.frameCount * 0.3 + pt.x * 0.05) % 360;

				p5.fill(hue, 55, 95, pt.alpha);
				p5.circle(pt.x, pt.y, pt.size);
			}
		};
	};
}
