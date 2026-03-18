<script lang="ts">
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import EmbedFieldHandler from '$lib/components/EmbedFieldHandler.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: Content.AnleitungSlice;

	// Animation aus CMS-Feldern mappen
	$: anim = mapAnimationFromPrimary(slice.primary);
	$: mobileVollbreite = (slice.primary as any).mobile_vollbreite ?? false;
</script>

<Bounded yPadding="sm" animate={anim.animate} animationOptions={anim.options} tag="section" class="{mobileVollbreite ? 'overflow-x-clip' : ''}">
	<div
		class="prose max-w-3xl mx-auto {mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}"
		data-slice-type="{slice.slice_type}EmbedFieldHandler"
		data-slice-variation={slice.variation}
	>
		{#if slice.primary.title}
			<h2 class="mb-4 font-bold">{slice.primary.title}</h2>
		{/if}
		{#if slice.primary.description}
			<div class="mb-6">
				<PrismicRichText field={slice.primary.description} />
			</div>
		{/if}
		{#if slice.primary.youtube_video && slice.primary.youtube_video.embed_url}
			<div class="mb-8 flex justify-center">
				{#if slice.primary.youtube_video.embed_url.startsWith('http')}
					<EmbedFieldHandler embed={slice.primary.youtube_video} />
				{:else}
					<div class="text-red-600 text-sm">
						Ungültige Video-URL: {slice.primary.youtube_video.embed_url}
					</div>
				{/if}
			</div>
		{/if}
		{#if slice.primary.steps && slice.primary.steps.length > 0}
			<ol class="list-decimal pl-6 space-y-4">
				{#each slice.primary.steps as step, i}
					<li>
						{#if step.step_title}
							<div class="font-semibold text-lg mb-1">{step.step_title}</div>
						{/if}
						{#if step.step_description}
							<PrismicRichText field={step.step_description} />
						{/if}
						{#if step.youtube_video && step.youtube_video.embed_url}
							<div class="my-4 flex justify-center">
								{#if step.youtube_video.embed_url.startsWith('http')}
									<EmbedFieldHandler embed={step.youtube_video} />
								{:else}
									<div class="text-red-600 text-sm">
										Ungültige Video-URL: {step.youtube_video.embed_url}
									</div>
								{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</Bounded>
