import type p5Type from 'p5';
import { orbitalCirclesSketch } from './orbital-circles';
import { particleFlowSketch } from './particle-flow';

export type SketchParams = {
	bgColor: string | null;
	overlayColor: string | null;
	overlayOpacity: number;
	bannerOverlap: boolean;
	bannerHeight: string;
	color: string | null;
};

type SketchFactory = (params: SketchParams) => (p5: p5Type, el: HTMLDivElement) => void;

// Registry: CMS Select-Wert → Factory-Funktion
// Neue Sketches hier eintragen und den Namen im model.json Select ergänzen.
const registry: Record<string, SketchFactory> = {
	'Orbital Circles': orbitalCirclesSketch,
	'Particle Flow': particleFlowSketch
};

const DEFAULT_SKETCH = 'Orbital Circles';

export function getSketch(
	name: string | null | undefined,
	params: SketchParams
): (p5: p5Type, el: HTMLDivElement) => void {
	const factory = (name && registry[name]) || registry[DEFAULT_SKETCH];
	return factory(params);
}
