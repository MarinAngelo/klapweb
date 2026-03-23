<script lang="ts">
	import { hexToRgba } from '$lib/utils/hexToRgba';

	// Farben (Hex), leer = kein Gradient
	export let color1: string | null = null;
	export let color2: string | null = null;
	// Deckkraft 0–1
	export let opacity1: number = 1;
	export let opacity2: number = 1;
	// Stop-Positionen in %
	export let stop1: string = '0%';
	export let stop2: string = '100%';
	// 'Linear' | 'Radial'
	export let type: string = 'Linear';
	// CSS-Gradzahl, z.B. '180deg'
	export let angle: string = '180deg';
	// Fallback wenn kein Gradient gesetzt (background-color oder background)
	export let fallback: string = 'transparent';

	$: rgba1 = color1 ? hexToRgba(color1, opacity1) : null;
	$: rgba2 = color2 ? hexToRgba(color2, opacity2) : null;
	$: value =
		rgba1 && rgba2
			? type === 'Radial'
				? `radial-gradient(circle, ${rgba1} ${stop1}, ${rgba2} ${stop2})`
				: `linear-gradient(${angle}, ${rgba1} ${stop1}, ${rgba2} ${stop2})`
			: fallback;
</script>

<div class="absolute inset-0" data-gradient-bg style="background: {value};" aria-hidden="true"></div>
