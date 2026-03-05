import type p5Type from 'p5';

// Converts a p5 color to a 6-digit hex string
function toHex(p5: p5Type, c: any): string {
	const r = Math.round(p5.red(c)).toString(16).padStart(2, '0');
	const g = Math.round(p5.green(c)).toString(16).padStart(2, '0');
	const b = Math.round(p5.blue(c)).toString(16).padStart(2, '0');
	return `#${r}${g}${b}`;
}

/**
 * Sketch: mouse X → background hue, mouse Y → text hue
 * Calls onUpdate(bgHex, textHex) on every frame so the panel can sync its inputs.
 */
export function textBgColorSketch(
	onUpdate: (bgHex: string, textHex: string) => void
): (p5: p5Type, el: HTMLDivElement) => void {
	return (p5: p5Type, el: HTMLDivElement) => {
		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
			p5.colorMode(p5.HSB, 360, 100, 100, 100);
			p5.textAlign(p5.CENTER, p5.CENTER);
			p5.noStroke();
		};

		p5.draw = () => {
			const bgHue = p5.map(p5.mouseX, 0, p5.width, 0, 360);
			const textHue = p5.map(p5.mouseY, 0, p5.height, 0, 360);

			const bgCol = p5.color(bgHue, 55, 90);
			const textCol = p5.color(textHue, 85, 55);

			const bgHex = toHex(p5, bgCol);
			const textHex = toHex(p5, textCol);

			// Update CSS vars live
			document.documentElement.style.setProperty('--page-bg-color', bgHex);
			document.documentElement.style.setProperty('--page-color', textHex);

			// Notify panel to sync inputs
			onUpdate(bgHex, textHex);

			// Draw preview: background + text sample
			p5.background(bgCol);

			// Text sample
			p5.fill(textCol);
			p5.textSize(p5.min(p5.width, p5.height) * 0.22);
			p5.text('Aa', p5.width / 2, p5.height * 0.42);

			// Smaller alphabet preview
			p5.textSize(p5.min(p5.width, p5.height) * 0.085);
			p5.text('Bb Cc Dd Ee', p5.width / 2, p5.height * 0.65);

			// Axis labels
			p5.textSize(p5.min(p5.width, p5.height) * 0.055);
			p5.fill(textCol);
			p5.text('← X: Hintergrund →', p5.width / 2, p5.height * 0.88);
			p5.push();
			p5.translate(p5.width * 0.07, p5.height / 2);
			p5.rotate(-p5.HALF_PI);
			p5.text('← Y: Schrift →', 0, 0);
			p5.pop();
		};
	};
}
