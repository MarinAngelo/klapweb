/**
 * Sketch Registry for P5Grafik Slice
 * ====================================
 * Connects CMS Select values to p5.js sketch factories.
 *
 * ## How to add a new sketch
 *
 * 1. Create `src/lib/sketches/my-sketch.ts` and export a factory function:
 *
 *    ```ts
 *    import type p5Type from 'p5';
 *    import type { SketchParams } from './index';
 *
 *    export function mySketch(params: SketchParams): (p5: p5Type, el: HTMLDivElement) => void {
 *      return (p5, el) => {
 *        p5.setup = () => { p5.createCanvas(el.offsetWidth, el.offsetHeight); };
 *        p5.draw  = () => { /* read params.bgColor, params.color, etc. here *\/ };
 *      };
 *    }
 *    ```
 *
 *    `params` is a mutable object — read it inside `draw()` to always get the
 *    latest CMS values without reinitialising p5.
 *
 * 2. Import and register the factory below:
 *    `'My Sketch Name': mySketch`
 *
 * 3. Add `"My Sketch Name"` to the `options` array in **both** variations of
 *    `src/lib/slices/P5Grafik/model.json` → `sketch_name.config.options`.
 *
 * ## SketchParams reference
 *
 * | Field            | Type            | Source (CMS field)          |
 * |------------------|-----------------|-----------------------------|
 * | `bgColor`        | `string\|null`  | hintergrundfarbe            |
 * | `overlayColor`   | `string\|null`  | overlay_color               |
 * | `overlayOpacity` | `number` (0–1)  | overlay_opacity             |
 * | `bannerOverlap`  | `boolean`       | banner_overlap              |
 * | `bannerHeight`   | `string`        | banner_height (e.g. '100 %')|
 * | `color`          | `string\|null`  | color (text/accent colour)  |
 */

import type p5Type from 'p5';
import { orbitalCirclesSketch } from './orbital-circles';
import { particleFlowSketch } from './particle-flow';
import { mySketch } from './my-sketches';

export { mySketch } from './my-sketches';

export type SketchParams = {
	bgColor: string | null;
	overlayColor: string | null;
	overlayOpacity: number;
	bannerOverlap: boolean;
	bannerHeight: string;
	color: string | null;
};

type SketchFactory = (params: SketchParams) => (p5: p5Type, el: HTMLDivElement) => void;

// Step 2: register new sketches here.
const registry: Record<string, SketchFactory> = {
	'Orbital Circles': orbitalCirclesSketch,
	'Particle Flow': particleFlowSketch,
	'My Sketch': mySketch
};

const DEFAULT_SKETCH = 'Orbital Circles';

export function getSketch(
	name: string | null | undefined,
	params: SketchParams
): (p5: p5Type, el: HTMLDivElement) => void {
	const factory = (name && registry[name]) || registry[DEFAULT_SKETCH];
	return factory(params);
}
