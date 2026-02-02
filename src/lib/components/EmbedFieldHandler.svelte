<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { onMount } from 'svelte';
	export let embed: any;

	// Nach dem Rendern: width/height-Attribute des iframes entfernen/überschreiben
	onMount(() => {
		const container = document.querySelector('.media-embed-html');
		if (container) {
			const iframe = container.querySelector('iframe');
			if (iframe) {
				iframe.removeAttribute('width');
				iframe.removeAttribute('height');
				iframe.style.width = '100%';
				iframe.style.aspectRatio = '16/9';
				iframe.style.height = 'auto';
				iframe.style.minHeight = '200px';
			}
		}
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
