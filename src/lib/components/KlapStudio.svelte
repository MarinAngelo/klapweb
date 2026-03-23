<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import P5Canvas from '$lib/components/P5Canvas.svelte';
	import { textBgColorSketch } from '$lib/sketches/text-bg-color';
	import { theme } from '$lib/stores/theme';
	import { hexToRgba } from '$lib/utils/hexToRgba';

	export let open = false;

	function getCssVar(key: string): string {
		return getComputedStyle(document.documentElement).getPropertyValue(key).trim() || '#000000';
	}

	// ── Page-level colors ──────────────────────────────────────────────────────
	let bgColor = '#000000';
	let textColor = '#000000';
	let sectionBgActive = false;
	let sketchActive = false;
	let sketchMode: 'dark' | 'light' = 'light';

	const sketch = textBgColorSketch(
		(bg, text) => {
			if (activeSlice) {
				// Slice-Modus: Sketch-Farben gehen auf das ausgewählte Element,
				// Seiten-CSS-Variablen werden sofort zurückgesetzt
				document.documentElement.style.setProperty('--page-bg-color', bgColor);
				document.documentElement.style.setProperty('--page-color', textColor);
				sliceBgColor = bg;
				sliceTextColor = text;
				activeSlice.el.style.setProperty('background-color', bg, 'important');
				activeSlice.el.style.setProperty('color', text, 'important');
				activeSlice.el.style.setProperty('--page-color', text, 'important');
			} else {
				// Seiten-Modus: wie bisher
				bgColor = bg;
				textColor = text;
				theme.update((t) => ({ ...t, pageBgColor: bg, pageColor: text }));
				if (sectionBgActive) setSectionBgStyle(bg);
			}
		},
		() => sketchMode
	);

	onMount(() => {
		bgColor = $theme.pageBgColor || getCssVar('--page-bg-color');
		textColor = $theme.pageColor || getCssVar('--page-color');
	});

	$: if (open) {
		bgColor = $theme.pageBgColor || getCssVar('--page-bg-color');
		textColor = $theme.pageColor || getCssVar('--page-color');
		buildSliceList();
	}

	const savedBgColors = new Map<HTMLElement, string>();

	function setSectionBgStyle(color: string) {
		document.querySelectorAll<HTMLElement>('[data-collapsible]').forEach((el) => {
			if (!savedBgColors.has(el)) {
				savedBgColors.set(el, el.style.getPropertyValue('background-color'));
			}
			el.style.setProperty('background-color', color, 'important');
		});
	}

	function clearSectionBgStyle() {
		savedBgColors.forEach((original, el) => {
			el.style.removeProperty('background-color');
			if (original) el.style.setProperty('background-color', original);
		});
		savedBgColors.clear();
	}

	function setBg(e: Event) {
		bgColor = (e.target as HTMLInputElement).value;
		document.documentElement.style.setProperty('--page-bg-color', bgColor);
		theme.update((t) => ({ ...t, pageBgColor: bgColor }));
		if (sectionBgActive) setSectionBgStyle(bgColor);
	}

	function setText(e: Event) {
		textColor = (e.target as HTMLInputElement).value;
		document.documentElement.style.setProperty('--page-color', textColor);
		theme.update((t) => ({ ...t, pageColor: textColor }));
	}

	function toggleSectionBg() {
		sectionBgActive = !sectionBgActive;
		if (sectionBgActive) setSectionBgStyle(bgColor);
		else clearSectionBgStyle();
	}

	// ── Slice-level colors ─────────────────────────────────────────────────────
	type SliceEntry = {
		el: HTMLElement;
		label: string;
		origStyle: string;
		origGradientStyle: string;
		btnEl: HTMLElement | null;
		origBtnStyle: string;
	};

	let sliceList: SliceEntry[] = [];
	let activeSlice: SliceEntry | null = null;
	let sliceBgColor = '#000000';
	let sliceTextColor = '#000000';
	let btnColor = '#000000';
	let btnBgColor = '#000000';
	let btnHoverColor = '#000000';
	let btnHoverBgColor = '#000000';

	// Gradient-State (nur Titelbereich / hero)
	let gradientEl: HTMLElement | null = null;
	let gradColor1 = '#ffffff';
	let gradColor2 = '#000000';
	let gradOpacity1 = 1;
	let gradOpacity2 = 1;
	let gradStop1 = 0;
	let gradStop2 = 100;
	let gradType = 'Linear';
	let gradAngle = '180deg';

	$: isHeroSlice = activeSlice?.el.dataset.sliceType === 'hero';

	function parseRgba(str: string): { hex: string; opacity: number } | null {
		const m = str.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/);
		if (!m) return null;
		const hex =
			'#' + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, '0')).join('');
		return { hex, opacity: m[4] !== undefined ? parseFloat(m[4]) : 1 };
	}

	function initGradientFromEl(el: HTMLElement) {
		gradientEl = el.querySelector<HTMLElement>('[data-gradient-bg]');
		if (!gradientEl) return;
		const bg = gradientEl.style.background || '';
		const linM = bg.match(
			/linear-gradient\(\s*([\d.]+)deg,\s*(rgba?\([^)]+\))\s+([\d.]+)%,\s*(rgba?\([^)]+\))\s+([\d.]+)%/
		);
		const radM = bg.match(
			/radial-gradient\(circle,\s*(rgba?\([^)]+\))\s+([\d.]+)%,\s*(rgba?\([^)]+\))\s+([\d.]+)%/
		);
		if (linM) {
			gradType = 'Linear';
			gradAngle = `${linM[1]}deg`;
			const c1 = parseRgba(linM[2]);
			if (c1) {
				gradColor1 = c1.hex;
				gradOpacity1 = c1.opacity;
			}
			gradStop1 = parseFloat(linM[3]);
			const c2 = parseRgba(linM[4]);
			if (c2) {
				gradColor2 = c2.hex;
				gradOpacity2 = c2.opacity;
			}
			gradStop2 = parseFloat(linM[5]);
		} else if (radM) {
			gradType = 'Radial';
			const c1 = parseRgba(radM[1]);
			if (c1) {
				gradColor1 = c1.hex;
				gradOpacity1 = c1.opacity;
			}
			gradStop1 = parseFloat(radM[2]);
			const c2 = parseRgba(radM[3]);
			if (c2) {
				gradColor2 = c2.hex;
				gradOpacity2 = c2.opacity;
			}
			gradStop2 = parseFloat(radM[4]);
		}
	}

	function reapplyGradient() {
		if (!gradientEl) return;
		const r1 = hexToRgba(gradColor1, gradOpacity1);
		const r2 = hexToRgba(gradColor2, gradOpacity2);
		gradientEl.style.background =
			gradType === 'Radial'
				? `radial-gradient(circle, ${r1} ${gradStop1}%, ${r2} ${gradStop2}%)`
				: `linear-gradient(${gradAngle}, ${r1} ${gradStop1}%, ${r2} ${gradStop2}%)`;
	}

	function formatSliceType(type: string): string {
		return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function buildSliceList() {
		const els = Array.from(document.querySelectorAll<HTMLElement>('[data-slice-type]'));
		const counts: Record<string, number> = {};
		sliceList = els.map((el) => {
			const type = el.dataset.sliceType ?? '?';
			counts[type] = (counts[type] ?? 0) + 1;
			const suffix = counts[type] > 1 ? ` #${counts[type]}` : '';
			return {
				el,
				label: formatSliceType(type) + suffix,
				origStyle: '',
				origGradientStyle: '',
				btnEl: el.querySelector<HTMLElement>('.button-prismic-link'),
				origBtnStyle: ''
			};
		});
		// If the previously active slice is no longer in DOM, reset
		if (activeSlice && !sliceList.find((s) => s.el === activeSlice!.el)) {
			activeSlice = null;
		}
	}

	function rgbToHex(rgb: string): string | null {
		if (!rgb || rgb === 'transparent') return null;
		const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
		if (!m) return null;
		return '#' + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, '0')).join('');
	}

	function selectSlice(entry: SliceEntry) {
		if (activeSlice) restoreSlice(activeSlice);
		activeSlice = entry;
		sketchActive = false;
		entry.origStyle = entry.el.style.cssText;

		const innerStyled = entry.el.querySelector<HTMLElement>('[style*="background-color"]');
		const computed = getComputedStyle(innerStyled ?? entry.el);
		sliceBgColor = rgbToHex(computed.backgroundColor) ?? bgColor;
		sliceTextColor = rgbToHex(computed.color) ?? textColor;

		if (entry.el.dataset.sliceType === 'hero') {
			const gEl = entry.el.querySelector<HTMLElement>('[data-gradient-bg]');
			entry.origGradientStyle = gEl?.style.cssText ?? '';
			initGradientFromEl(entry.el);
		}

		if (entry.btnEl) {
			entry.origBtnStyle = entry.btnEl.style.cssText;
			const bc = getComputedStyle(entry.btnEl);
			btnColor = rgbToHex(bc.color) ?? '#000000';
			btnBgColor = rgbToHex(bc.backgroundColor) ?? '#000000';
			// CSS vars are not readable via getComputedStyle — read from inline style directly
			const rawHoverColor = entry.btnEl.style.getPropertyValue('--hover-text-color').trim();
			const rawHoverBg = entry.btnEl.style.getPropertyValue('--hover-bg-color').trim();
			btnHoverColor = rawHoverColor || btnColor;
			btnHoverBgColor = rawHoverBg || btnBgColor;
		}
	}

	function deselectSlice() {
		if (activeSlice) restoreSlice(activeSlice);
		activeSlice = null;
	}

	function restoreSlice(entry: SliceEntry) {
		entry.el.style.cssText = entry.origStyle;
		if (entry.btnEl) entry.btnEl.style.cssText = entry.origBtnStyle;
		const gEl = entry.el.querySelector<HTMLElement>('[data-gradient-bg]');
		if (gEl) gEl.style.cssText = entry.origGradientStyle;
		gradientEl = null;
	}

	function setSliceBg(e: Event) {
		sliceBgColor = (e.target as HTMLInputElement).value;
		if (activeSlice)
			activeSlice.el.style.setProperty('background-color', sliceBgColor, 'important');
	}

	function setSliceText(e: Event) {
		sliceTextColor = (e.target as HTMLInputElement).value;
		if (activeSlice) {
			activeSlice.el.style.setProperty('color', sliceTextColor, 'important');
			activeSlice.el.style.setProperty('--page-color', sliceTextColor, 'important');
		}
	}

	function setBtnColor(e: Event) {
		btnColor = (e.target as HTMLInputElement).value;
		if (activeSlice?.btnEl) {
			activeSlice.btnEl.style.setProperty('color', btnColor, 'important');
			activeSlice.btnEl.style.setProperty('border-color', btnColor, 'important');
			activeSlice.btnEl.style.setProperty('--focus-ring-color', btnColor, 'important');
		}
	}

	function setBtnBgColor(e: Event) {
		btnBgColor = (e.target as HTMLInputElement).value;
		if (activeSlice?.btnEl) {
			activeSlice.btnEl.style.setProperty('background-color', btnBgColor, 'important');
		}
	}

	function setBtnHoverColor(e: Event) {
		btnHoverColor = (e.target as HTMLInputElement).value;
		if (activeSlice?.btnEl) {
			activeSlice.btnEl.style.setProperty('--hover-text-color', btnHoverColor);
		}
	}

	function setBtnHoverBgColor(e: Event) {
		btnHoverBgColor = (e.target as HTMLInputElement).value;
		if (activeSlice?.btnEl) {
			activeSlice.btnEl.style.setProperty('--hover-bg-color', btnHoverBgColor);
		}
	}

	function clearSliceStyles() {
		if (activeSlice) restoreSlice(activeSlice);
		activeSlice = null;
	}

	// ── Copy helper ────────────────────────────────────────────────────────────
	let copiedField: string | null = null;
	function copy(value: string, field: string) {
		navigator.clipboard.writeText(value);
		copiedField = field;
		setTimeout(() => (copiedField = null), 1200);
	}

	// ── Cleanup ────────────────────────────────────────────────────────────────
	$: if (!open) {
		clearSectionBgStyle();
		clearSliceStyles();
	}
	onDestroy(() => {
		clearSectionBgStyle();
		clearSliceStyles();
	});
</script>

{#if open}
	<aside class="panel">
		<div class="header">
			<span class="title">Design Panel</span>
			<div class="header-actions">
				<button
					class="toggle"
					class:on={sketchActive}
					on:click={() => (sketchActive = !sketchActive)}
					title="Farbsketch ein/aus">⬡</button
				>
				<button class="close" on:click={() => (open = false)} title="Schliessen (Ctrl+Shift+K)"
					>✕</button
				>
			</div>
		</div>

		{#if sketchActive}
			<div class="row-header">
				<button
					class="mode-btn"
					class:on={sketchMode === 'dark'}
					on:click={() => (sketchMode = 'dark')}>◼ Dunkel</button
				>
				<button
					class="mode-btn"
					class:on={sketchMode === 'light'}
					on:click={() => (sketchMode = 'light')}>◻ Hell</button
				>
			</div>
			<div class="sketch-wrap">
				<P5Canvas {sketch} width="100%" height="100%" />
			</div>
			<p class="hint-sketch">Maus X = Hintergrund · Maus Y = Schrift</p>
		{/if}

		<!-- Page-level colors -->
		<label class="row">
			<span>Hintergrundfarbe (Page)</span>
			<div class="color-wrap">
				<input type="color" value={bgColor} on:input={setBg} />
				<code>{bgColor}</code>
				<button class="copy-btn" on:click={() => copy(bgColor, 'bg')} title="Kopieren">
					{copiedField === 'bg' ? '✓' : '⧉'}
				</button>
			</div>
		</label>

		<label class="row">
			<span>Schriftfarbe</span>
			<div class="color-wrap">
				<input type="color" value={textColor} on:input={setText} />
				<code>{textColor}</code>
				<button class="copy-btn" on:click={() => copy(textColor, 'text')} title="Kopieren">
					{copiedField === 'text' ? '✓' : '⧉'}
				</button>
			</div>
		</label>

		<div class="row">
			<div class="row-header">
				<span>Hintergrundfarbe (Slices+)</span>
				<button class="toggle" class:on={sectionBgActive} on:click={toggleSectionBg}>
					{sectionBgActive ? 'AN' : 'AUS'}
				</button>
			</div>
		</div>

		<!-- Divider -->
		<div class="divider"></div>

		<!-- Slice-level colors -->
		<div class="section-label">Slice-Farben</div>

		<div class="slice-list">
			{#each sliceList as entry}
				<button
					class="slice-btn"
					class:active={activeSlice === entry}
					on:click={() => (activeSlice === entry ? deselectSlice() : selectSlice(entry))}
				>
					{entry.label}
				</button>
			{/each}
			{#if sliceList.length === 0}
				<span class="hint-sketch">Keine Slices gefunden</span>
			{/if}
		</div>

		{#if activeSlice}
			<label class="row">
				<span>Hintergrundfarbe</span>
				<div class="color-wrap">
					<input type="color" value={sliceBgColor} on:input={setSliceBg} />
					<code>{sliceBgColor}</code>
					<button class="copy-btn" on:click={() => copy(sliceBgColor, 'slice-bg')} title="Kopieren">
						{copiedField === 'slice-bg' ? '✓' : '⧉'}
					</button>
				</div>
			</label>

			<label class="row">
				<span>Schriftfarbe</span>
				<div class="color-wrap">
					<input type="color" value={sliceTextColor} on:input={setSliceText} />
					<code>{sliceTextColor}</code>
					<button
						class="copy-btn"
						on:click={() => copy(sliceTextColor, 'slice-text')}
						title="Kopieren"
					>
						{copiedField === 'slice-text' ? '✓' : '⧉'}
					</button>
				</div>
			</label>

			{#if activeSlice.btnEl}
				<label class="row">
					<span>Schaltfläche Farbe</span>
					<div class="color-wrap">
						<input type="color" value={btnColor} on:input={setBtnColor} />
						<code>{btnColor}</code>
						<button class="copy-btn" on:click={() => copy(btnColor, 'btn-color')} title="Kopieren">
							{copiedField === 'btn-color' ? '✓' : '⧉'}
						</button>
					</div>
				</label>

				<label class="row">
					<span>Schaltfläche Hintergrund</span>
					<div class="color-wrap">
						<input type="color" value={btnBgColor} on:input={setBtnBgColor} />
						<code>{btnBgColor}</code>
						<button class="copy-btn" on:click={() => copy(btnBgColor, 'btn-bg')} title="Kopieren">
							{copiedField === 'btn-bg' ? '✓' : '⧉'}
						</button>
					</div>
				</label>

				<label class="row">
					<span>Schaltfläche Hover Farbe</span>
					<div class="color-wrap">
						<input type="color" value={btnHoverColor} on:input={setBtnHoverColor} />
						<code>{btnHoverColor}</code>
						<button
							class="copy-btn"
							on:click={() => copy(btnHoverColor, 'btn-hover-color')}
							title="Kopieren"
						>
							{copiedField === 'btn-hover-color' ? '✓' : '⧉'}
						</button>
					</div>
				</label>

				<label class="row">
					<span>Schaltfläche Hover Hintergrund</span>
					<div class="color-wrap">
						<input type="color" value={btnHoverBgColor} on:input={setBtnHoverBgColor} />
						<code>{btnHoverBgColor}</code>
						<button
							class="copy-btn"
							on:click={() => copy(btnHoverBgColor, 'btn-hover-bg')}
							title="Kopieren"
						>
							{copiedField === 'btn-hover-bg' ? '✓' : '⧉'}
						</button>
					</div>
				</label>
			{/if}

		{#if isHeroSlice}
			<div class="divider"></div>
			<div class="section-label">Verlauf</div>

			<label class="row">
				<span>Form</span>
				<select class="studio-select" bind:value={gradType} on:change={reapplyGradient}>
					<option>Linear</option>
					<option>Radial</option>
				</select>
			</label>

			{#if gradType === 'Linear'}
				<label class="row">
					<span>Richtung</span>
					<select class="studio-select" bind:value={gradAngle} on:change={reapplyGradient}>
						{#each ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'] as a}
							<option value={a}>{a.replace('deg', '°')}</option>
						{/each}
					</select>
				</label>
			{/if}

			<label class="row">
				<span>Startfarbe</span>
				<div class="color-wrap">
					<input type="color" bind:value={gradColor1} on:input={reapplyGradient} />
					<code>{gradColor1}</code>
					<button class="copy-btn" on:click={() => copy(gradColor1, 'gc1')} title="Kopieren">
						{copiedField === 'gc1' ? '✓' : '⧉'}
					</button>
				</div>
			</label>
			<label class="row">
				<span>Startfarbe Deckkraft ({gradOpacity1.toFixed(2)})</span>
				<input type="range" min="0" max="1" step="0.01" bind:value={gradOpacity1} on:input={reapplyGradient} />
			</label>
			<label class="row">
				<span>Startfarbe Position ({gradStop1}%)</span>
				<input type="range" min="0" max="100" step="1" bind:value={gradStop1} on:input={reapplyGradient} />
			</label>

			<label class="row">
				<span>Endfarbe</span>
				<div class="color-wrap">
					<input type="color" bind:value={gradColor2} on:input={reapplyGradient} />
					<code>{gradColor2}</code>
					<button class="copy-btn" on:click={() => copy(gradColor2, 'gc2')} title="Kopieren">
						{copiedField === 'gc2' ? '✓' : '⧉'}
					</button>
				</div>
			</label>
			<label class="row">
				<span>Endfarbe Deckkraft ({gradOpacity2.toFixed(2)})</span>
				<input type="range" min="0" max="1" step="0.01" bind:value={gradOpacity2} on:input={reapplyGradient} />
			</label>
			<label class="row">
				<span>Endfarbe Position ({gradStop2}%)</span>
				<input type="range" min="0" max="100" step="1" bind:value={gradStop2} on:input={reapplyGradient} />
			</label>
		{/if}
	{/if}
	</aside>
{/if}

<style>
	.panel {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 9900;
		width: 260px;
		background: rgba(20, 20, 25, 0.95);
		color: #fff;
		border-radius: 0.625rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(12px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		font-family: ui-monospace, monospace;
		padding: 0.875rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		max-height: 90vh;
		overflow-y: auto;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sketch-wrap {
		width: 100%;
		height: 220px;
		flex-shrink: 0;
		border-radius: 0.375rem;
		overflow: hidden;
	}

	.hint-sketch {
		font-size: 0.6rem;
		opacity: 0.35;
		text-align: center;
		margin: 0;
	}

	.title {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		opacity: 0.45;
	}

	.close {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.35);
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0;
		line-height: 1;
	}

	.close:hover {
		color: #fff;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.75rem;
		opacity: 0.9;
		cursor: default;
	}

	.color-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	input[type='color'] {
		width: 2.5rem;
		height: 2rem;
		border: none;
		border-radius: 0.3rem;
		cursor: pointer;
		padding: 0.1rem;
		background: rgba(255, 255, 255, 0.08);
	}

	code {
		font-size: 0.75rem;
		opacity: 0.6;
		flex: 1;
	}

	.copy-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.3);
		cursor: pointer;
		font-size: 0.8rem;
		padding: 0;
		line-height: 1;
		transition: color 0.15s;
	}

	.copy-btn:hover {
		color: #fff;
	}

	.row-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.toggle {
		font-family: inherit;
		font-size: 0.6rem;
		font-weight: 700;
		padding: 0.15rem 0.4rem;
		border-radius: 0.25rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.4);
		cursor: pointer;
		transition: all 0.15s;
	}

	.toggle.on {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
		border-color: rgba(255, 255, 255, 0.5);
	}

	.mode-btn {
		flex: 1;
		font-family: inherit;
		font-size: 0.6rem;
		font-weight: 700;
		padding: 0.2rem 0;
		border-radius: 0.25rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.35);
		cursor: pointer;
		transition: all 0.15s;
	}

	.mode-btn.on {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
		border-color: rgba(255, 255, 255, 0.5);
	}

	.divider {
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		margin: -0.25rem 0;
	}

	.section-label {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		opacity: 0.45;
	}

	.slice-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.slice-btn {
		font-family: inherit;
		font-size: 0.7rem;
		text-align: left;
		padding: 0.3rem 0.5rem;
		border-radius: 0.3rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: all 0.15s;
	}

	.slice-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.85);
	}

	.slice-btn.active {
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
		border-color: rgba(255, 255, 255, 0.4);
	}

	input[type='range'] {
		width: 100%;
		accent-color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
	}

	.studio-select {
		width: 100%;
		font-family: inherit;
		font-size: 0.75rem;
		padding: 0.25rem 0.4rem;
		border-radius: 0.3rem;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(255, 255, 255, 0.07);
		color: #fff;
		cursor: pointer;
	}

	.studio-select option {
		background: #1a1a20;
		color: #fff;
	}
</style>
