import type p5Type from 'p5';

function toHex(p5: p5Type, c: any): string {
	const r = Math.round(p5.red(c)).toString(16).padStart(2, '0');
	const g = Math.round(p5.green(c)).toString(16).padStart(2, '0');
	const b = Math.round(p5.blue(c)).toString(16).padStart(2, '0');
	return `#${r}${g}${b}`;
}

// WCAG relative luminance (0–1 range)
function luminance(r: number, g: number, b: number): number {
	const lin = (c: number) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(p5: p5Type, a: any, b: any): number {
	const la = luminance(Math.round(p5.red(a)), Math.round(p5.green(a)), Math.round(p5.blue(a)));
	const lb = luminance(Math.round(p5.red(b)), Math.round(p5.green(b)), Math.round(p5.blue(b)));
	const hi = Math.max(la, lb);
	const lo = Math.min(la, lb);
	return (hi + 0.05) / (lo + 0.05);
}

/**
 * Sketch: mouse X → background hue, mouse Y → text hue.
 * Colors are only applied to the page when the mouse is inside the canvas AND not frozen.
 * Double-click inside the canvas to toggle freeze.
 */
export function textBgColorSketch(
	onUpdate: (bgHex: string, textHex: string) => void,
	getMode: () => 'dark' | 'light' = () => 'light'
): (p5: p5Type, el: HTMLDivElement) => void {
	return (p5: p5Type, el: HTMLDivElement) => {
		let frozen = false;

		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
			p5.colorMode(p5.HSB, 360, 100, 100, 100);
			p5.textAlign(p5.CENTER, p5.CENTER);
			p5.noStroke();
		};

		p5.doubleClicked = () => {
			frozen = !frozen;
			return false; // prevent text selection
		};

		p5.draw = () => {
			const s = p5.min(p5.width, p5.height);
			const bgHue = p5.map(p5.mouseX, 0, p5.width, 0, 360);
			const textHue = p5.map(p5.mouseY, 0, p5.height, 0, 360);
			const dark = getMode() === 'dark';

			const bgCol = dark ? p5.color(bgHue, 70, 20) : p5.color(bgHue, 30, 95);
			const textCol = dark ? p5.color(textHue, 20, 95) : p5.color(textHue, 80, 25);

			const ratio = contrast(p5, bgCol, textCol);
			const valid = ratio >= 4.5;

			const mouseInCanvas =
				p5.mouseX >= 0 && p5.mouseX <= p5.width && p5.mouseY >= 0 && p5.mouseY <= p5.height;

			// Only apply to page when mouse is on canvas and not frozen
			if (valid && mouseInCanvas && !frozen) {
				const bgHex = toHex(p5, bgCol);
				const textHex = toHex(p5, textCol);
				document.documentElement.style.setProperty('--page-bg-color', bgHex);
				document.documentElement.style.setProperty('--page-color', textHex);
				onUpdate(bgHex, textHex);
			}

			// Background
			p5.background(bgCol);

			// Subtle red overlay for insufficient contrast
			if (!valid) {
				p5.fill(0, 70, 100, 18);
				p5.rect(0, 0, p5.width, p5.height);
			}

			// Contrast ratio badge
			p5.fill(valid ? p5.color(120, 70, 75) : p5.color(0, 80, 100));
			p5.textSize(s * 0.075);
			p5.text(`${ratio.toFixed(1)}:1 ${valid ? '✓' : '✗'}`, p5.width / 2, p5.height * 0.11);

			// Freeze indicator
			if (frozen) {
				p5.fill(p5.color(55, 80, 100)); // amber
				p5.textSize(s * 0.06);
				p5.text('gesperrt', p5.width / 2, p5.height * 0.21);
			}

			// Text preview
			const previewY = frozen ? 0.5 : 0.45;
			p5.fill(textCol);
			p5.textSize(s * 0.22);
			p5.text('Aa', p5.width / 2, p5.height * previewY);

			p5.textSize(s * 0.085);
			p5.text('Bb Cc Dd Ee', p5.width / 2, p5.height * (previewY + 0.21));

			// Axis labels
			p5.textSize(s * 0.055);
			p5.text('← X: Hintergrund →', p5.width / 2, p5.height * 0.88);
			p5.push();
			p5.translate(p5.width * 0.07, p5.height / 2);
			p5.rotate(-p5.HALF_PI);
			p5.text('← Y: Schrift →', 0, 0);
			p5.pop();
		};
	};
}
