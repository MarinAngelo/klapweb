<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import P5Canvas from '$lib/components/P5Canvas.svelte';
	import { textBgColorSketch } from '$lib/sketches/text-bg-color';

	export let open = false;

	function getCssVar(key: string): string {
		return getComputedStyle(document.documentElement).getPropertyValue(key).trim() || '#000000';
	}

	let bgColor = '#000000';
	let textColor = '#000000';
	let sectionBgActive = false;
	let sketchActive = false;
	let sketchMode: 'dark' | 'light' = 'light';

	const sketch = textBgColorSketch(
		(bg, text) => {
			bgColor = bg;
			textColor = text;
			if (sectionBgActive) setSectionBgStyle(bg);
		},
		() => sketchMode
	);

	onMount(() => {
		bgColor = getCssVar('--page-bg-color');
		textColor = getCssVar('--page-color');
	});

	// Re-read values each time panel is opened
	$: if (open) {
		bgColor = getCssVar('--page-bg-color');
		textColor = getCssVar('--page-color');
	}

	// Direct inline style override for slice backgrounds
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
		if (sectionBgActive) setSectionBgStyle(bgColor);
	}

	function setText(e: Event) {
		textColor = (e.target as HTMLInputElement).value;
		document.documentElement.style.setProperty('--page-color', textColor);
	}

	function toggleSectionBg() {
		sectionBgActive = !sectionBgActive;
		if (sectionBgActive) setSectionBgStyle(bgColor);
		else clearSectionBgStyle();
	}

	let copiedField: 'bg' | 'text' | null = null;
	function copy(value: string, field: 'bg' | 'text') {
		navigator.clipboard.writeText(value);
		copiedField = field;
		setTimeout(() => (copiedField = null), 1200);
	}

	// Clean up on panel close or component destroy
	$: if (!open) clearSectionBgStyle();
	onDestroy(clearSectionBgStyle);
</script>

{#if open}
	<aside class="panel">
		<div class="header">
			<span class="title">Design Panel</span>
			<div class="header-actions">
				<button class="toggle" class:on={sketchActive} on:click={() => (sketchActive = !sketchActive)} title="Farbsketch ein/aus">⬡</button>
				<button class="close" on:click={() => (open = false)} title="Schliessen (Ctrl+Shift+K)">✕</button>
			</div>
		</div>

		{#if sketchActive}
			<div class="row-header">
				<button class="mode-btn" class:on={sketchMode === 'dark'} on:click={() => (sketchMode = 'dark')}>◼ Dunkel</button>
				<button class="mode-btn" class:on={sketchMode === 'light'} on:click={() => (sketchMode = 'light')}>◻ Hell</button>
			</div>
			<div class="sketch-wrap">
				<P5Canvas {sketch} width="100%" height="100%" />
			</div>
			<p class="hint-sketch">Maus X = Hintergrund · Maus Y = Schrift</p>
		{/if}

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
		aspect-ratio: 1;
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

	.close:hover { color: #fff; }

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

	.copy-btn:hover { color: #fff; }

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
</style>
