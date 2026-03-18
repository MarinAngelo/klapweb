<script lang="ts">
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import { theme } from '$lib/stores/theme';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
	import { sanitizeHtml } from '$lib/utils/sanitizeHtml';

	export let slice: Content.HtmlCodeSlice;

	const htmlCode = (slice.primary.html_code?.[0] as { text: string })?.text || '';
	const sanitizedHtmlCode = sanitizeHtml(htmlCode);

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = (slice.primary as any).mobile_vollbreite ?? false;
</script>

<Bounded
	tag="section"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class="{mobileVollbreite ? 'overflow-x-hidden' : ''}"
>
	<div class="html-code-container {mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}" style="--hr-color: {$theme.pageColor};">
		{@html sanitizedHtmlCode}
	</div>
</Bounded>

<style>
	/* Verwende :global(), um das hr innerhalb des Containers anzusprechen */
	/* und nutze height/background-color für ein modernes Styling */
	:global(.html-code-container hr) {
		border: none; /* Standard-Browser-Rahmen entfernen */
		height: 1px; /* Dicke der Linie über Höhe steuern */
		background-color: var(--hr-color); /* Farbe der Linie (oder {$theme.pageColor}) */
		color: transparent; /* Verhindert ggf. Darstellung durch Browser-Theme-Farbe */
	}
</style>
