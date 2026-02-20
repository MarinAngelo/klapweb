<script lang="ts">
	import { onMount } from 'svelte';
	import type { Content } from '@prismicio/client';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import { convertNumberInverse } from '$lib/utils/convertNumber';
	import { mapAnimation } from '$lib/utils/animationMapper';
	import { useOpenIndex } from '$lib/utils/useOpenIndex';

	export let slice: Content.CodeEinbettenSlice;

	const { openIndex, toggleItem } = useOpenIndex();

	// Animation aus CMS-Feldern mappen
	$: anim = mapAnimation(
		slice.primary.animate,
		slice.primary.anim_direction,
		slice.primary.anim_delay,
		slice.primary.anim_duration
	);

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

	const { pageBgColor } = get(theme);
	const opacity = convertNumberInverse(slice.primary.opacity ?? 0) || 0.5;
</script>

<Bounded
	tag="section"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
>
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
				<div
					class="absolute inset-0 bg-opacity-50"
					style="background-color: {pageBgColor}; opacity: {opacity};"
				></div>
			</div>
		{/each}
	</div>
</Bounded>
