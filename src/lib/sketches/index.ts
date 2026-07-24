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
import { generativeGestaltungP1_0_01 } from './generative-gestaltung-P1_0_01';
import { generativeGestaltungP1_1_1_01 } from './generative-gestaltung-P1_1_1_01';
import { generativeGestaltungP1_2_1_01 } from './generative-gestaltung-P1_2_1_01';
import { generativeGestaltungP1_2_1_01Touch } from './generative-gestaltung-P1_2_1_01-touch';
import { generativeGestaltungP1_2_2_01 } from './generative-gestaltung-P1_2_2_01';
import { generativeGestaltungP2_2_2_01 } from './generative-gestaltung-P2_2_2_01';

export { mySketch } from './my-sketches';
export { generativeGestaltungP1_0_01 } from './generative-gestaltung-P1_0_01';
export { generativeGestaltungP1_1_1_01 } from './generative-gestaltung-P1_1_1_01';
export { generativeGestaltungP1_2_1_01 } from './generative-gestaltung-P1_2_1_01';
export { generativeGestaltungP1_2_1_01Touch } from './generative-gestaltung-P1_2_1_01-touch';
export { generativeGestaltungP1_2_2_01 } from './generative-gestaltung-P1_2_2_01';
export { generativeGestaltungP2_2_2_01 } from './generative-gestaltung-P2_2_2_01';

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
	'My Sketch': mySketch,
	'Generative Gestaltung P_1_0_01': generativeGestaltungP1_0_01,
	'Generative Gestaltung P_1_1_1_01': generativeGestaltungP1_1_1_01,
	'Generative Gestaltung P_1_2_1_01': generativeGestaltungP1_2_1_01,
	'Generative Gestaltung P_1_2_1_01 Touch': generativeGestaltungP1_2_1_01Touch,
	'Generative Gestaltung P_1_2_2_01': generativeGestaltungP1_2_2_01,
	'Generative Gestaltung P_2_2_2_01': generativeGestaltungP2_2_2_01
};

const DEFAULT_SKETCH = 'Orbital Circles';

export function getSketch(
	name: string | null | undefined,
	params: SketchParams
): (p5: p5Type, el: HTMLDivElement) => void {
	const factory = (name && registry[name]) || registry[DEFAULT_SKETCH];
	return factory(params);
}
