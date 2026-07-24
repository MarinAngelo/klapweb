import type p5Type from 'p5';
import type { SketchParams } from './index';

export function generativeGestaltungP1_2_1_01Touch(
	params: SketchParams
): (p5: p5Type, el: HTMLDivElement) => void {
	return (p5, el) => {
		let tileCountX = 2;
		let tileCountY = 10;
		let colorsLeft: p5Type.Color[] = [];
		let colorsRight: p5Type.Color[] = [];
		let interpolateShortest = true;
		let inputX = 0;
		let inputY = 0;
		let scrollInputY = 0;

		function shakeColors() {
			for (let i = 0; i < tileCountY; i++) {
				colorsLeft[i] = p5.color(p5.random(0, 60), p5.random(0, 100), 100);
				colorsRight[i] = p5.color(p5.random(160, 190), 100, p5.random(0, 100));
			}
		}

		function onScroll() {
			if (!el.isConnected) {
				window.removeEventListener('scroll', onScroll);
				return;
			}
			const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
			scrollInputY = p5.map(window.scrollY, 0, maxScroll, 0, p5.height);
		}

		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
			p5.colorMode(p5.HSB);
			p5.noStroke();
			inputX = p5.width / 2;
			inputY = p5.height / 2;
			scrollInputY = p5.height / 2;
			shakeColors();
			window.addEventListener('scroll', onScroll, { passive: true });
		};

		p5.draw = () => {
			if (p5.touches.length > 0) {
				// Touch: X und Y vom Finger
				const t = p5.touches[0] as { x: number; y: number };
				inputX = t.x;
				inputY = t.y;
			} else {
				// Desktop: X immer von Maus (wenn auf Canvas), Y immer vom Scroll
				if (p5.mouseX >= 0 && p5.mouseX <= p5.width) {
					inputX = p5.mouseX;
				}
				inputY = scrollInputY;
			}
			tileCountX = p5.int(p5.map(p5.constrain(inputX, 0, p5.width), 0, p5.width, 2, 100));
			tileCountY = p5.int(p5.map(p5.constrain(inputY, 0, p5.height), 0, p5.height, 2, 10));
			while (colorsLeft.length < tileCountY) {
				colorsLeft.push(p5.color(p5.random(0, 60), p5.random(0, 100), 100));
				colorsRight.push(p5.color(p5.random(160, 190), 100, p5.random(0, 100)));
			}
			const tileWidth = p5.width / tileCountX;
			const tileHeight = p5.height / tileCountY;
			for (let gridY = 0; gridY < tileCountY; gridY++) {
				const col1 = colorsLeft[gridY];
				const col2 = colorsRight[gridY];
				for (let gridX = 0; gridX < tileCountX; gridX++) {
					const amount = p5.map(gridX, 0, tileCountX - 1, 0, 1);
					let interCol: p5Type.Color;
					if (interpolateShortest) {
						p5.colorMode(p5.RGB);
						interCol = p5.lerpColor(col1, col2, amount);
						p5.colorMode(p5.HSB);
					} else {
						interCol = p5.lerpColor(col1, col2, amount);
					}
					p5.fill(interCol);
					p5.rect(tileWidth * gridX, tileHeight * gridY, tileWidth, tileHeight);
				}
			}
		};

		p5.mouseReleased = () => {
			shakeColors();
		};

		p5.touchEnded = () => {
			shakeColors();
			return false;
		};

		p5.touchMoved = () => {
			return false;
		};

		p5.keyPressed = () => {
			if (p5.key === 's' || p5.key === 'S')
				p5.saveCanvas('generative-gestaltung-' + Date.now(), 'png');
			if (p5.key === '1') interpolateShortest = true;
			if (p5.key === '2') interpolateShortest = false;
		};
	};
}
