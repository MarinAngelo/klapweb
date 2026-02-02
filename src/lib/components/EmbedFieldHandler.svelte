<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { onMount } from 'svelte';
	export let embed: any;

	// Nach dem Rendern: width/height-Attribute aller iframes entfernen/überschreiben
	onMount(() => {
		const iframes = document.querySelectorAll('.media-embed-html iframe');
		iframes.forEach((iframe) => {
			const el = iframe as HTMLIFrameElement;
			el.removeAttribute('width');
			el.removeAttribute('height');
			el.style.width = '100%';
			el.style.aspectRatio = '16/9';
			el.style.height = 'auto';
			el.style.minHeight = '200px';
		});
	});
</script>

{#if embed && embed.html}
	<div class="media-embed-html w-full max-w-3xl mx-auto mb-6" style="text-align:center">
		{@html embed.html}
	</div>
{:else}
	<div style="text-align:center">
		<Button
			link={{ url: embed.embed_url, target: '_blank' }}
			text="Medienlink öffnen"
			color={undefined}
			bgColor={undefined}
			hoverColor={undefined}
			hoverBgColor={undefined}
		/>
	</div>
{/if}

<style>
	.media-embed-html iframe {
		width: 100% !important;
		aspect-ratio: 16/9;
		height: auto !important;
		min-height: 200px;
		display: block;
	}
</style>
