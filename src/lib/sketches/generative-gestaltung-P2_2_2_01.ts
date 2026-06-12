import type p5Type from 'p5';
import type { SketchParams } from './index';

/**
 * Generative Gestaltung P_2_2_2_01
 * Polygon-Form mit variablen Ecken — Maus X steuert Eckenzahl,
 * Maus Y steuert Radius-Variation der einzelnen Ecken.
 */
export function generativeGestaltungP2_2_2_01(params: SketchParams): (p5: p5Type, el: HTMLDivElement) => void {
	return (p5, el) => {
		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
			p5.smooth();
		};

		p5.draw = () => {
			const bg = params.bgColor || '#0d0d0d';
			const fg = params.color  || '#ffffff';

			p5.background(bg);

			const cx = p5.width  / 2;
			const cy = p5.height / 2;

			// Maus X → Anzahl Ecken (3–36)
			const cornerCount = Math.max(3, Math.floor(p5.map(p5.mouseX, 0, p5.width, 3, 36)));
			// Maus Y → Radius-Variation (0–0.6 × Basis-Radius)
			const radiusNoise  = p5.map(p5.mouseY, 0, p5.height, 0, 0.6);
			const baseRadius   = Math.min(p5.width, p5.height) * 0.38;

			// Mehrere konzentrische Formen für Tiefe
			const layerCount = 4;
			for (let l = 0; l < layerCount; l++) {
				const t      = p5.frameCount * 0.008 + l * 0.4;
				const rScale = 1 - l * 0.18;
				const alpha  = p5.map(l, 0, layerCount - 1, 220, 60);

				p5.noFill();
				p5.stroke(p5.color(fg + Math.round(alpha).toString(16).padStart(2, '0')));
				p5.strokeWeight(p5.map(l, 0, layerCount - 1, 1.5, 0.5));

				p5.beginShape();
				for (let i = 0; i <= cornerCount; i++) {
					const angle  = (i / cornerCount) * p5.TWO_PI - p5.HALF_PI;
					const noise  = p5.noise(
						p5.cos(angle) * 1.5 + t,
						p5.sin(angle) * 1.5 + t
					);
					const r = baseRadius * rScale * (1 - radiusNoise * 0.5 + radiusNoise * noise);
					p5.curveVertex(cx + p5.cos(angle) * r, cy + p5.sin(angle) * r);
				}
				// Zwei Extra-Punkte am Anfang/Ende für geschlossene curveVertex-Kurve
				for (let i = 0; i < 2; i++) {
					const angle = (i / cornerCount) * p5.TWO_PI - p5.HALF_PI;
					const noise = p5.noise(p5.cos(angle) * 1.5 + t, p5.sin(angle) * 1.5 + t);
					const r = baseRadius * rScale * (1 - radiusNoise * 0.5 + radiusNoise * noise);
					p5.curveVertex(cx + p5.cos(angle) * r, cy + p5.sin(angle) * r);
				}
				p5.endShape();
			}

			// Ecken-Punkte der äussersten Form
			const t0 = p5.frameCount * 0.008;
			p5.noStroke();
			p5.fill(fg);
			for (let i = 0; i < cornerCount; i++) {
				const angle = (i / cornerCount) * p5.TWO_PI - p5.HALF_PI;
				const noise = p5.noise(p5.cos(angle) * 1.5 + t0, p5.sin(angle) * 1.5 + t0);
				const r = baseRadius * (1 - radiusNoise * 0.5 + radiusNoise * noise);
				p5.circle(cx + p5.cos(angle) * r, cy + p5.sin(angle) * r, 3);
			}
		};

		p5.keyReleased = () => {
			if (p5.key === 's' || p5.key === 'S') {
				p5.saveCanvas('P_2_2_2_01_' + Date.now(), 'png');
			}
		};
	};
}
