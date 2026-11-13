<script lang="ts">
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import EmbedFieldHandler from '$lib/components/EmbedFieldHandler.svelte';
	import VideoFile from '$lib/components/VideoFile.svelte';
	import { _ } from '$lib/stores/i18n';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	import { planFilter, isVisibleForPlan } from '$lib/stores/planFilter';
	import { ALL_CHAPTERS } from '$lib/anleitung/options.js';
	import type { GuideChapter } from '$lib/server/anleitung';

	export let slice: Content.AnleitungSlice;
	export let context: { guideChapters?: Record<string, GuideChapter[]> } | undefined = undefined;
	const p = slice.primary ?? ({} as any);

	// Chapters from the code (src/lib/anleitung, field «Kapitel aus der Anleitung»): texts come
	// from the page load (context). Order: title, the editor's own part (description, video,
	// steps), then «Claude Anleitung Titel» (h3) and the chapter text
	const chapterChoice: string = (slice.primary as any)?.chapter || '';
	const showsAll = chapterChoice === ALL_CHAPTERS;
	const chapterTitle: string = (slice.primary as any)?.chapter_title || '';
	$: chapters = (context?.guideChapters?.[slice.id] ?? []).filter((c) =>
		isVisibleForPlan(c.featureLabel, $planFilter)
	);
	$: chapter = showsAll ? null : (chapters[0] ?? null);
	$: chapterMissing =
		!!chapterChoice && !showsAll && !(context?.guideChapters?.[slice.id] ?? []).length;
	// One chapter of a feature outside the chosen package: hide the whole element
	$: hidden = !!chapterChoice && !showsAll && !chapterMissing && chapters.length === 0;

	// Animation aus CMS-Feldern mappen
	$: anim = mapAnimationFromPrimary(slice.primary);
	// Own video file (Link to Media) — field may be missing from generated types until slicemachine push
	const videoFileOf = (item: unknown) => (item as any)?.video_file;
	$: mobileVollbreite = (slice.primary as any).mobile_full_width ?? false;
</script>

{#if !hidden}
	<Bounded
		yPadding="sm"
		animate={anim.animate}
		animationOptions={anim.options}
		tag="section"
		class={mobileVollbreite ? 'overflow-x-clip' : ''}
	>
		<div
			class="prose max-w-3xl {mobileVollbreite ? '-mx-6 md:mx-0 px-6 md:px-0' : ''}"
			data-slice-type={slice.slice_type}
			data-slice-variation={slice.variation}
		>
			{#if p.title || chapter}
				<h2 class="mb-4 font-bold">{p.title || chapter?.title}</h2>
			{/if}
			{#if p.description}
				<div class="mb-6">
					<PrismicRichText field={p.description} />
				</div>
			{/if}
			{#if videoFileOf(p)?.url}
				<div class="mb-8 flex justify-center">
					<VideoFile field={videoFileOf(p)} />
				</div>
			{:else if p.youtube_video?.embed_url || p.video_embed_code}
				<div class="mb-8 flex justify-center">
					{#if !p.youtube_video?.embed_url || p.youtube_video.embed_url.startsWith('http')}
						<EmbedFieldHandler embed={p.youtube_video} code={p.video_embed_code} />
					{:else}
						<div class="text-red-600 text-sm">
							{$_('Ungültige Video-URL')}: {p.youtube_video.embed_url}
						</div>
					{/if}
				</div>
			{/if}
			{#if p.steps && p.steps.length > 0}
				<ol class="list-decimal pl-6 space-y-4">
					{#each p.steps ?? [] as step, i}
						<li>
							{#if step.step_title}
								<div class="font-semibold text-lg mb-1">{step.step_title}</div>
							{/if}
							{#if step.step_description}
								<PrismicRichText field={step.step_description} />
							{/if}
							{#if videoFileOf(step)?.url}
								<div class="my-4 flex justify-center">
									<VideoFile field={videoFileOf(step)} />
								</div>
							{:else if step.youtube_video?.embed_url || step.video_embed_code}
								<div class="my-4 flex justify-center">
									{#if !step.youtube_video?.embed_url || step.youtube_video.embed_url.startsWith('http')}
										<EmbedFieldHandler embed={step.youtube_video} code={step.video_embed_code} />
									{:else}
										<div class="text-red-600 text-sm">
											{$_('Ungültige Video-URL')}: {step.youtube_video.embed_url}
										</div>
									{/if}
								</div>
							{/if}
						</li>
					{/each}
				</ol>
			{/if}
			<!-- Below the editor's own part: the text from the code (src/lib/anleitung) -->
			{#if chapterTitle && (chapter || (showsAll && chapters.length))}
				<h3 class="mt-8 mb-4 font-bold">{chapterTitle}</h3>
			{/if}
			{#if chapter}
				<div>{@html chapter.html}</div>
			{:else if chapterMissing}
				<p class="text-red-600">{$_('Kapitel nicht gefunden')}: {chapterChoice}</p>
			{/if}
			{#if showsAll}
				{#each chapters as item (item.id)}
					<section class="mt-12 first:mt-0">
						<h2 class="mb-4 font-bold">{item.title}</h2>
						{@html item.html}
					</section>
				{/each}
			{/if}
		</div>
	</Bounded>
{/if}
