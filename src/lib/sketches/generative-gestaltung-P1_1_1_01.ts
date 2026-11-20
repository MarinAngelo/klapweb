import type p5Type from 'p5';
import type { SketchParams } from './index';

export function generativeGestaltungP1_1_1_01(
	params: SketchParams
): (p5: p5Type, el: HTMLDivElement) => void {
	return (p5, el) => {
		let stepX: number;
		let stepY: number;
		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
			p5.noStroke();
			p5.colorMode(p5.HSB, p5.width, p5.height, 100);
		};
		p5.draw = () => {
			stepX = p5.mouseX + 2;
			stepY = p5.mouseY + 2;
			for (let gridY = 0; gridY < p5.height; gridY += stepY) {
				for (let gridX = 0; gridX < p5.width; gridX += stepX) {
					p5.fill(gridX, p5.height - gridY, 100);
					p5.rect(gridX, gridY, stepX, stepY);
				}
			}
		};
		p5.keyPressed = () => {
			if (p5.key === 's' || p5.key === 'S') {
				p5.saveCanvas('generative-gestaltung-' + Date.now(), 'png');
			}
		};
	};
}
