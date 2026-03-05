<script lang="ts">
	import P5Canvas from '$lib/components/P5Canvas.svelte';
	import type p5Type from 'p5';

	// CSS variables controlled by the studio
	let vars: { key: string; label: string; value: string }[] = [
		{ key: '--page-color', label: '--page-color', value: '#5f5fab' },
		{ key: '--page-bg-color', label: '--page-bg-color', value: '#c7c9fe' }
	];

	let activeIdx = 0;
	let pickedHex = '';

	function rgbToHex(r: number, g: number, b: number): string {
		return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
	}

	function applyColor(hex: string) {
		if (typeof document === 'undefined') return;
		vars[activeIdx].value = hex;
		vars = vars; // trigger reactivity
		document.documentElement.style.setProperty(vars[activeIdx].key, hex);
	}

	function onHexInput(e: Event, i: number) {
		const val = (e.target as HTMLInputElement).value;
		if (/^#[0-9a-fA-F]{6}$/.test(val)) {
			vars[i].value = val;
			vars = vars;
			document.documentElement.style.setProperty(vars[i].key, val);
		}
	}

	function sketch(p5: p5Type, el: HTMLDivElement) {
		let segmentCount = 360;

		p5.setup = () => {
			p5.createCanvas(el.offsetWidth, el.offsetHeight);
			p5.noStroke();
		};

		p5.draw = () => {
			p5.colorMode(p5.HSB, 360, p5.width, p5.height);
			p5.background(360, 0, p5.height);

			const radius = Math.min(p5.width, p5.height) * 0.42;
			const angleStep = 360 / segmentCount;

			p5.beginShape(p5.TRIANGLE_FAN);
			p5.vertex(p5.width / 2, p5.height / 2);
			for (let angle = 0; angle <= 360; angle += angleStep) {
				const vx = p5.width / 2 + p5.cos(p5.radians(angle)) * radius;
				const vy = p5.height / 2 + p5.sin(p5.radians(angle)) * radius;
				p5.vertex(vx, vy);
				p5.fill(angle, p5.mouseX, p5.mouseY);
			}
			p5.endShape();
		};

		p5.mouseClicked = () => {
			if (p5.mouseX < 0 || p5.mouseX > p5.width || p5.mouseY < 0 || p5.mouseY > p5.height) return;
			const c = p5.get(p5.mouseX, p5.mouseY);
			if (Array.isArray(c) && c[3] > 10) {
				const hex = rgbToHex(c[0], c[1], c[2]);
				pickedHex = hex;
				applyColor(hex);
			}
		};

		p5.keyPressed = () => {
			const map: Record<string, number> = { '1': 360, '2': 45, '3': 24, '4': 12, '5': 6 };
			if (p5.key in map) segmentCount = map[p5.key];
		};
	}
</script>

<!-- Fixed full-viewport overlay -->
<div class="studio">
	<P5Canvas {sketch} width="100%" height="100%" />

	<!-- Control panel -->
	<aside class="panel">
		<p class="panel-title">Klap Studio</p>

		<div class="vars">
			{#each vars as v, i}
				<button
					class="var-btn"
					class:active={activeIdx === i}
					on:click={() => (activeIdx = i)}
					title="Click to select, then click a color on the canvas"
				>
					<span class="swatch" style="background-color: {v.value};"></span>
					<span class="var-label">{v.label}</span>
				</button>
				<input
					class="hex-input"
					type="text"
					value={v.value}
					maxlength="7"
					on:change={(e) => onHexInput(e, i)}
				/>
			{/each}
		</div>

		{#if pickedHex}
			<div class="picked">
				<span class="swatch" style="background-color: {pickedHex};"></span>
				<code>{pickedHex}</code>
				<span class="arrow">→ {vars[activeIdx].label}</span>
			</div>
		{/if}

		<p class="hint">
			Maus X = Sättigung · Maus Y = Helligkeit<br />
			Klick = Farbe auf aktive Variable anwenden<br />
			Tasten 1–5 = Segmente
		</p>
	</aside>
</div>

<style>
	.studio {
		position: fixed;
		inset: 0;
		z-index: 8000;
		background: #111;
	}

	.panel {
		position: absolute;
		top: 1.25rem;
		left: 1.25rem;
		background: rgba(0, 0, 0, 0.82);
		color: #fff;
		padding: 1rem 1.25rem;
		border-radius: 0.625rem;
		min-width: 220px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		font-family: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.panel-title {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		opacity: 0.5;
		margin: 0;
	}

	.vars {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.var-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.6rem;
		border-radius: 0.375rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1.5px solid transparent;
		color: #fff;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.75rem;
		text-align: left;
		transition: border-color 0.15s;
	}

	.var-btn.active {
		border-color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.1);
	}

	.swatch {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border-radius: 0.25rem;
		border: 1px solid rgba(255, 255, 255, 0.25);
		flex-shrink: 0;
	}

	.var-label {
		flex: 1;
	}

	.hex-input {
		font-family: inherit;
		font-size: 0.75rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.25rem;
		color: #fff;
		padding: 0.25rem 0.5rem;
		width: 100%;
		box-sizing: border-box;
	}

	.picked {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding-top: 0.5rem;
	}

	.arrow {
		opacity: 0.5;
		font-size: 0.65rem;
	}

	.hint {
		font-size: 0.65rem;
		opacity: 0.4;
		line-height: 1.6;
		margin: 0;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		padding-top: 0.5rem;
	}
</style>
