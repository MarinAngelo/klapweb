<script lang="ts">
	import { onMount } from 'svelte';
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	export let slice: Content.CodeEinbettenSlice;

	let isMobile = false;

	onMount(() => {
		isMobile = window.innerWidth <= 768;

		// Event-Listener für Fenstergröße
		const handleResize = () => {
			isMobile = window.innerWidth <= 768;
		};
		window.addEventListener('resize', handleResize);

		// Event-Listener entfernen, wenn die Komponente zerstört wird
		return () => {
			window.removeEventListener('resize', handleResize);
		};
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

