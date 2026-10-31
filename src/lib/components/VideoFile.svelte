<script lang="ts">
	// Own video file from the Prismic media library (Link to Media), played by the browser —
	// no third-party player, no consent needed
	import { _ } from '$lib/stores/i18n';

	export let field: { url?: string; name?: string } | null | undefined;

	const VIDEO_EXT = /\.(mp4|m4v|webm|mov|ogv)$/i;

	$: url = field?.url ?? '';
	$: isVideo = VIDEO_EXT.test(field?.name ?? '') || VIDEO_EXT.test(url.split('?')[0]);
</script>

{#if url && isVideo}
	<div class="w-full max-w-3xl mx-auto mb-6">
		<!-- svelte-ignore a11y-media-has-caption -->
		<video
			src={url}
			title={field?.name || $_('Video')}
			controls
			playsinline
			preload="metadata"
			class="block w-full h-auto"
		></video>
	</div>
{:else if url}
	<div class="text-red-600 text-sm">
		{$_('Ungültige Video-Datei (MP4 erwartet)')}: {field?.name || url}
	</div>
{/if}
