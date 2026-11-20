import type p5Type from 'p5';
import type { SketchParams } from './index';

export function generativeGestaltungP1_0_01(
	params: SketchParams
): (p5: p5Type, el: HTMLDivElement) => void {
	return (p5, el) => {
		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
			p5.noCursor();
			p5.colorMode(p5.HSB, 360, 100, 100);
			p5.rectMode(p5.CENTER);
			p5.noStroke();
		};
		p5.draw = () => {
			// Hintergrundfarbe abhängig von Mausposition (wie im Original)
			p5.background(p5.mouseY / 2, 100, 100);
			// Rechteckfarbe abhängig von Mausposition
			p5.fill(360 - p5.mouseY / 2, 100, 100);
			// Rechteckgröße abhängig von Mausposition
			const size = p5.mouseX + 1;
			p5.rect(p5.width / 2, p5.height / 2, size, size);
		};
		p5.keyPressed = () => {
			if (p5.key === 's' || p5.key === 'S') {
				// gd.timestamp() ist ein Hilfsmodul aus dem Buch, hier ersetzen wir es durch Date.now()
				p5.saveCanvas('generative-gestaltung-' + Date.now(), 'png');
			}
		};
	};
}
