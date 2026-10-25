<script lang="ts">
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
	import { sanitizeHtml } from '$lib/utils/sanitizeHtml';
	import { servicesInHtml } from '$lib/consent/services';
	import ConsentGate from '$lib/components/ConsentGate.svelte';

	export let slice: Content.HtmlCodeSlice;
	const p = slice.primary ?? ({} as any);

	const htmlCode = (p.html_code?.[0] as { text: string })?.text || '';
	const sanitizedHtmlCode = sanitizeHtml(htmlCode);

	// External iframes/scripts → consent required (one known service, otherwise generic)
	const externalServices = servicesInHtml(htmlCode);
	const consentServiceId =
		externalServices.length === 1
			? externalServices[0]
			: externalServices.length
				? 'external_embed'
				: '';

	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = (slice.primary as any).mobile_full_width ?? false;
</script>

<Bounded
	tag="section"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class={mobileVollbreite ? 'overflow-x-clip' : ''}
>
	<div
		class="html-code-container {mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}"
		style="--hr-color: var(--page-color);"
	>
		{#if consentServiceId}
			<ConsentGate service={consentServiceId}>
				{@html sanitizedHtmlCode}
			</ConsentGate>
		{:else}
			{@html sanitizedHtmlCode}
		{/if}
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
