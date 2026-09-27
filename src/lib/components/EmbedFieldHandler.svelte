<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { afterUpdate } from 'svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import { _ } from '$lib/stores/i18n';
	import { serviceIdFor } from '$lib/consent/services';
	import { videoPlayerSrc } from '$lib/utils/videoEmbed';
	export let embed: any;
	/** Alternative: pasted embed code (<iframe …>) or video URL, used when the embed field is empty */
	export let code: string | null | undefined = undefined;

	$: codeSrc = embed?.html ? '' : videoPlayerSrc(code);
	$: consentServiceId = serviceIdFor(codeSrc || embed?.provider_name || embed?.embed_url);

	// Nach dem Rendern (auch nach Freigabe im ConsentGate): width/height-Attribute der iframes überschreiben
	afterUpdate(() => {
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
		<ConsentGate service={consentServiceId} minHeight={300}>
			{@html embed.html}
		</ConsentGate>
	</div>
{:else if codeSrc}
	<div class="media-embed-html w-full max-w-3xl mx-auto mb-6">
		<ConsentGate service={consentServiceId} minHeight={300}>
			<iframe
				src={codeSrc}
				title={$_('Video')}
				allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
				referrerpolicy="strict-origin-when-cross-origin"
				allowfullscreen
			></iframe>
		</ConsentGate>
	</div>
{:else if embed?.embed_url}
	<div style="text-align:center">
		<Button
			link={{ url: embed.embed_url, target: '_blank' }}
			text={$_('Medienlink öffnen')}
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
		border: 0;
	}
</style>
