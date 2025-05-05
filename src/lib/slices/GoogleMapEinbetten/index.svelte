<script lang="ts">
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	export let slice: Content.CodeEinbettenSlice;

	// Prüfen, ob die Ansicht mobil ist
	let isMobile = window.innerWidth <= 768;

	// Event-Listener für Fenstergröße (optional, falls dynamische Anpassung bei Größenänderung benötigt wird)
	window.addEventListener('resize', () => {
		isMobile = window.innerWidth <= 768;
	});
</script>

<Bounded tag="section" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<!-- HTML-Code rendern -->
	<div class="relative w-full">
		{#each slice.primary.html_code as code}
			<div class="relative">
				<!-- Gerenderter HTML-Code -->
				<div>
					{@html code.text
						.replace(/width="\d+"/g, 'width="100%"')
							.replace(
								/style="[^"]*"/g,
								isMobile
									? 'style="width: 100%; height: 100vw;"'
									: 'style="width: 100%; height: 25vw;"'
							)}
				</div>
				<!-- Overlay -->
				<div class="absolute inset-0 bg-black bg-opacity-50"></div>
			</div>
		{/each}
	</div>
</Bounded>

<style>
	/* Optional: Styling für das Overlay */
	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5); /* Schwarzes Overlay mit 50% Transparenz */
	}
</style>
