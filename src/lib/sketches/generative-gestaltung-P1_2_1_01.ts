import type p5Type from 'p5';
import type { SketchParams } from './index';

export function generativeGestaltungP1_2_1_01(
	params: SketchParams
): (p5: p5Type, el: HTMLDivElement) => void {
	return (p5, el) => {
		let tileCountX = 2;
		let tileCountY = 10;
		let colorsLeft: p5Type.Color[] = [];
		let colorsRight: p5Type.Color[] = [];
		let colors: p5Type.Color[] = [];
		let interpolateShortest = true;

		function shakeColors() {
			for (let i = 0; i < tileCountY; i++) {
				colorsLeft[i] = p5.color(p5.random(0, 60), p5.random(0, 100), 100);
				colorsRight[i] = p5.color(p5.random(160, 190), 100, p5.random(0, 100));
			}
		}

		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
			p5.colorMode(p5.HSB);
			p5.noStroke();
			shakeColors();
		};

		p5.draw = () => {
			tileCountX = p5.int(p5.map(p5.constrain(p5.mouseX, 0, p5.width), 0, p5.width, 2, 100));
			tileCountY = p5.int(p5.map(p5.constrain(p5.mouseY, 0, p5.height), 0, p5.height, 2, 10));
			const tileWidth = p5.width / tileCountX;
			const tileHeight = p5.height / tileCountY;
			let interCol: p5Type.Color;
			colors = [];

			for (let gridY = 0; gridY < tileCountY; gridY++) {
				const col1 = colorsLeft[gridY];
				const col2 = colorsRight[gridY];
				for (let gridX = 0; gridX < tileCountX; gridX++) {
					const amount = p5.map(gridX, 0, tileCountX - 1, 0, 1);
					if (interpolateShortest) {
						p5.colorMode(p5.RGB);
						interCol = p5.lerpColor(col1, col2, amount);
						p5.colorMode(p5.HSB);
					} else {
						interCol = p5.lerpColor(col1, col2, amount);
					}
					p5.fill(interCol);
					const posX = tileWidth * gridX;
					const posY = tileHeight * gridY;
					p5.rect(posX, posY, tileWidth, tileHeight);
					colors.push(interCol);
				}
			}
		};

		p5.mouseReleased = () => {
			shakeColors();
		};

		p5.keyPressed = () => {
			if (p5.key === 's' || p5.key === 'S') {
				p5.saveCanvas('generative-gestaltung-' + Date.now(), 'png');
			}
			if (p5.key === '1') interpolateShortest = true;
			if (p5.key === '2') interpolateShortest = false;
			// Export als .ase ist nicht implementiert
		};
	};
}
