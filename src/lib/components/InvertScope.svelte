<script lang="ts">
	/**
	 * «Seitenfarben umkehren»: swaps page text and background color for the wrapped slice —
	 * CSS variables via .invert-colors (app.css), store values via $lib/stores/pageColors
	 */
	import { provideInvertedPageColors } from '$lib/stores/pageColors';

	provideInvertedPageColors();
</script>

<div class="invert-colors">
	<slot />
</div>
