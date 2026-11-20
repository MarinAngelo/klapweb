<script lang="ts">
	import type { RTEmbedNode } from '@prismicio/client';
	import EmbedFieldHandler from '$lib/components/EmbedFieldHandler.svelte';

	// Rich-text embeds (YouTube, Vimeo …) go through the consent gate like embed fields
	export let node: RTEmbedNode;
</script>

<EmbedFieldHandler embed={node.oembed} />
