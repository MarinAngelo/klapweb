<script lang="ts">
    import { PrismicImage, PrismicRichText } from '@prismicio/svelte';
	export let image: any;
	export let text: any;
	export let imageLeft: boolean = false;
	export let imageBgColor: string = '';
	export let imageRound: boolean = false;
	export let theme: any;
</script>

<div class="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
	{#if imageLeft}
		<!-- Bild links, Text rechts -->
		<div>
			{#if image}
				<div style="background-color: {imageBgColor};">
					<PrismicImage
						field={image}
						sizes="100vw"
						class="w-full {imageRound ? 'rounded-full' : 'rounded-3xl'}"
					/>
				</div>
			{/if}
		</div>
		<div>
			<PrismicRichText field={text} />
		</div>
	{:else}
		<!-- Text links, Bild rechts -->
		<div>
			<PrismicRichText field={text} />
		</div>
		<div>
			{#if image}
				<div style="background-color: {imageBgColor};">
					<PrismicImage
						field={image}
						sizes="100vw"
						class="w-full {imageRound ? 'rounded-full' : 'rounded-3xl'}"
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>
