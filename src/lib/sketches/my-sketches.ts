// src/lib/sketches/my-sketches.ts
import type p5Type from 'p5';
import type { SketchParams } from './index';

export function mySketch(params: SketchParams): (p5: p5Type, el: HTMLDivElement) => void {
	return (p5, el) => {
		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
		};
		p5.draw = () => {
			// background: string (Farbcode) oder number (Grauwert)
			if (typeof params.bgColor === 'string') {
				p5.background(params.bgColor);
			} else {
				p5.background(220);
			}
			// fill: string (Farbcode) oder number (Grauwert)
			if (typeof params.color === 'string') {
				p5.fill(params.color);
			} else {
				p5.fill(0);
			}
			p5.ellipse(p5.width / 2, p5.height / 2, 100, 100);
		};
	};
}
