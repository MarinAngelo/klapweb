<script lang="ts">
	// Own wrapper: replaces {{Variables}}, theme headings/links
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import RichTextEmbed from '$lib/components/PrismicRichText/Embed.svelte';
	import { _ } from '$lib/stores/i18n';

	/** Task with beschreibung, bild, werkzeuge (shape of /api/aufgaben-liste) */
	export let aufgabe: any;
</script>

<div class="grid grid-cols-1 gap-8 {aufgabe.bild?.url ? 'md:grid-cols-2' : ''}">
	<div class="flex flex-col">
		{#if aufgabe.beschreibung}
			<div class="prose">
				<PrismicRichText field={aufgabe.beschreibung} components={{ embed: RichTextEmbed }} />
			</div>
		{/if}
	</div>
	{#if aufgabe.bild?.url}
		<div class="md:rounded-3xl overflow-hidden">
			<img
				src={aufgabe.bild.url}
				alt={aufgabe.bild.alt || aufgabe.titel}
				class="w-full h-full object-cover"
			/>
		</div>
	{/if}
</div>

{#if aufgabe.werkzeuge?.length > 0}
	<div class="flex flex-col gap-6">
		<p class="text-xs font-medium uppercase text-muted">{$_('Benötigte Werkzeuge')}</p>
		{#each aufgabe.werkzeuge as w}
			<div class="grid grid-cols-1 gap-8 {w.bild?.url ? 'md:grid-cols-2' : ''}">
				<div class="flex flex-col gap-1">
					<p class="font-medium">{w.titel}</p>
					{#if w.beschreibung}
						<div class="prose text-sm opacity-80">
							<PrismicRichText field={w.beschreibung} components={{ embed: RichTextEmbed }} />
						</div>
					{/if}
				</div>
				{#if w.bild?.url}
					<div class="md:rounded-3xl overflow-hidden">
						<img src={w.bild.url} alt={w.bild.alt || w.titel} class="w-full h-full object-cover" />
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
